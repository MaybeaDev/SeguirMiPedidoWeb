const { getAuth } = require("firebase-admin/auth");
const { FieldValue, Timestamp } = require("firebase-admin/firestore");
const { onCall } = require("firebase-functions/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

initializeApp();
exports.createUser = onCall(async (r) => {
  const data = {
    email: r.data.correo,
    emailVerified: false,
    phoneNumber: "+56" + r.data.telefono,
    password: r.data.rut,
    displayName: r.data.nombre,
    disabled: false,
  };
  logger.log(data);
  const dataRutFormateado = {
    ...r.data,
    rut: formatRut(r.data.rut),
  };
  await getAuth()
    .createUser(data)
    .then(async (userRecord) => {
      logger.log("Successfully created new user:", userRecord.uid);
      await getFirestore()
        .collection("Usuarios")
        .doc(userRecord.uid)
        .set(dataRutFormateado)
        .then(() => {
          return {
            success: true,
            message: "Usuario creado exitosamente",
            uid: userRecord.uid,
          };
        });
    })
    .catch((error) => {
      return { success: false, message: "Usuario no creado" };
    });
});
const formatRut = (value) => {
  const numbers = value.toLowerCase().replace(/[^0-9k]/gi, "");

  if (numbers.length == 0) {
    return "";
  } else if (numbers.length == 1) {
    return numbers;
  } else {
    const dv = numbers.slice(-1);
    const numeroBase = numbers.slice(0, -1);
    const partes = numeroBase
      .split("")
      .reverse()
      .join("")
      .match(/.{1,3}/g);
    const rutFormateado =
      (partes ?? []).join(".").split("").reverse().join("") + "-" + dv;
    return rutFormateado;
  }
};

exports.sacarPaquetesAReparto = onDocumentUpdated(
  "Rutas/{rutaId}",
  async (event) => {
    const doc = event.data;
    if (doc == undefined) return;
    const antes = doc.before.data();
    const despues = doc.after.data();
    if (!antes.en_reparto && despues.en_reparto) {
      const paquetesRef = getFirestore()
        .collection("Paquetes")
        .where("ruta", "==", doc.before.id)
        .where("estado", "not-in", [3, 5]);
      try {
        const snapshot = await paquetesRef.get();
        const batch = getFirestore().batch();

        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            estado: 2,
            historial: FieldValue.arrayUnion({
              fecha: new Date(),
              estado: 2,
              detalles: "Paquete en reparto",
            }),
          });
        });

        await batch.commit();
        logger.log(
          `Estado de los paquetes de la ruta ${doc.before.id} actualizado correctamente.`
        );
      } catch (error) {
        logger.error("Error al actualizar los paquetes:", error);
      }
    }
  }
);

exports.changePassword = onCall(async (request) => {
  const { uid, newPassword } = request.data; // Recibe el uid y la nueva contraseña como parámetros

  if (!uid || !newPassword) {
    return {
      success: false,
      message: "El uid y la nueva contraseña son obligatorios.",
    };
  }

  try {
    await getAuth().updateUser(uid, { password: newPassword });
    logger.log(`Contraseña actualizada para el usuario: ${uid}`);
    return { success: true, message: "Contraseña actualizada exitosamente." };
  } catch (error) {
    logger.error("Error al actualizar la contraseña:", error);
    return {
      success: false,
      message: "Error al actualizar la contraseña.",
      error: error.message,
    };
  }
});

exports.eliminarDatosAntiguos = onSchedule(
  {
    schedule: "0 0 1 * *",
    timeZone: "America/Santiago",
    timeoutSeconds: 900,
    memory: "1GiB",
  },
  async (event) => {
    logger.log("aaaaaaaaaaaaa");
    try {
      const campRef = getFirestore().doc("/metadatos/campanias"); // Referencia al documento
      const camp = (await campRef.get()).data().campañas; // Obtener la lista de ca
      const del = [];
      while (camp.length > 4) {
        del.push(camp.shift());
      }
      await campRef.update({ campañas: camp });
      if (del.length > 0) {
        const q1 = getFirestore()
          .collection("Paquetes")
          .where("campania", "in", del);
        const s1 = await q1.get();
        const q2 = getFirestore().collection("Premios");
        const s2 = await q2.get();
        const premios = {};
        s2.docs.forEach((doc) => {
          premios[doc.id] = doc.ref;
        });
        const batch = getFirestore().batch();
        let fechaMasReciente = new Date(0);
        s1.docs.forEach((doc) => {
          if (Object.keys(premios).includes(doc.id.slice(0, 10))) {
            batch.delete(premios[doc.id.slice(0, 10)]);
          }
          if (doc.createTime.toDate() > fechaMasReciente) {
            fechaMasReciente = doc.createTime.toDate();
          }
          batch.delete(doc.ref);
        });

        // Ejecutar el batch
        await batch.commit();

        logger.log(`Eliminados ${s1.docs.length} documentos antiguos.`);
        logger.log(
          `Limpiando archivos en Storage anteriores a ${fechaMasReciente.toISOString()}...`
        );
        try {
          await cleanStorageBeforeDate(fechaMasReciente, maxFilesPerBatch);
        } catch (e) {
          logger.error("Error durente la eliminacion de fotos: ", JSON.stringify(error))
        }
      }
      logger.log(`No hay documentos antiguos.`);
    } catch (error) {
      logger.error("Error durante la eliminación de documentos:", JSON.stringify(error));
    }
  }
);

exports.setRange = onCall(async (r) => {
  const { uid, range } = r.data;

  if (uid == null || range == null) {
    throw new Error("Faltan parámetros requeridos: uid y range");
  }

  try {
    await getAuth().setCustomUserClaims(uid, { range });
    return {
      success: true,
      message: `Claim "range" establecido en ${range} para el usuario ${uid}`,
    };
  } catch (error) {
    logger.error("Error al establecer custom claims:", error);
    throw new Error("No se pudieron establecer los custom claims");
  }
});

async function cleanStorageBeforeDate(date, maxFilesPerBatch = 100) {
  if (isNaN(date.getTime())) throw new Error("Fecha inválida");

  const storage = getStorage().bucket();
  let totalDeletedFiles = 0;
  let nextPageToken = undefined;

  do {
    const [files, , apiResponse] = await storage.getFiles({
      maxResults: maxFilesPerBatch,
      pageToken: nextPageToken,
    });

    nextPageToken = apiResponse?.nextPageToken;

    for (const file of files) {
      const fileName = file.name;
      const match = fileName.match(/^img_\d+_(\d+)\.jpg$/);
      if (!match) continue;

      const timestamp = Number(match[1]);
      if (isNaN(timestamp)) continue;

      const fechaArchivo = new Date(timestamp);
      if (fechaArchivo < date) {
        try {
          // await file.delete(); // habilitar en prod
          totalDeletedFiles++;
          logger.log(`🗑️ Archivo eliminado: ${fileName}`);
        } catch (error) {
          logger.error(`❌ Error al eliminar ${fileName}: ${error.message}`);
        }
      }
    }
  } while (nextPageToken);

  logger.log(`Eliminación completada. Total eliminados: ${totalDeletedFiles}`);
  return { totalDeletedFiles };
}
