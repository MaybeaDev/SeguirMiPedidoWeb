import { getAuth } from "firebase-admin/auth";
import { onCall } from "firebase-functions/https";

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

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
  console.log(data);
  const dataRutFormateado = {
    ...r.data,
    rut: formatRut(r.data.rut),
  };
  await getAuth()
    .createUser(data)
    .then(async (userRecord) => {
      console.log("Successfully created new user:", userRecord.uid);
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
const formatRut = (value: string) => {
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
