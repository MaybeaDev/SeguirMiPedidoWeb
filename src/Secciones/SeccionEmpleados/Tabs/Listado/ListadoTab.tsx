import { useEffect, useState } from "react";
import {
  PaqueteContext,
  TransportistaContext,
} from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";
import { useOutletContext } from "react-router-dom";
import ModalPremios from "../../../../components/Layout/ModalPremios/ModalPremios";
import Table from "../../../../components/UI/Table/Table";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";

const ListadoTab = () => {
  const { paquetesContext, transportistasContext, premiosContext } =
    useOutletContext<{
      paquetesContext: PaqueteContext[];
      transportistasContext: Record<string, TransportistaContext>;
      premiosContext: Record<
        string,
        {
          premios: Record<string, number>;
          transportista: string;
          entregado: boolean;
        }
      >;
    }>();
  const [usuarios, setUsuarios] = useState<string[][]>([]);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalData, setModalData] = useState<Record<string, number>[]>([]);
  console.log(paquetesContext);

  const getUsers = async () => {
    const users: string[][] = [];
    Object.values(transportistasContext).map((doc) => {
      if (doc.tipo == 0) {
        users.push([
          doc.nombre,
          doc.rut,
          doc.correo,
          doc.telefono,
          doc.ultimaConexion
            ? doc.ultimaConexion.toDate().toLocaleString()
            : "No registrado",
          doc.versionApp ?? "App antigua",
        ]);
      }
    });
    setUsuarios(users);
    setTableData(users);
  };
  useEffect(() => {
    getUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportistasContext]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    const searchTerms = query
      .split(";") // Divide por punto y coma
      .map((term) => normalizeString(term)) // Normaliza cada término
      .filter((term) => term.length > 0); // Elimina términos vacíos
    const filteredData = usuarios.filter((user) =>
      // Cada término debe coincidir en al menos un campo del paquete
      searchTerms.every((term) =>
        user.some((field) =>
          normalizeString((field ?? "").toString()).includes(term)
        )
      )
    );
    setTableData(filteredData);
  };
  const normalizeString = (str: string): string => {
    return str
      .normalize("NFD") // Descompone los caracteres con tildes en base + tilde
      .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes y diacríticos
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // Elimina caracteres invisibles
      .replace(/\s+/g, " ") // Reemplaza múltiples espacios por uno solo
      .trim() // Elimina espacios al inicio y final
      .toLowerCase(); // Convierte a minúsculas
  };
  const openModal = async (rut: string) => {
    try {
      const trabajador = Object.values(transportistasContext).find(
        (t) => t.rut === rut
      );

      if (!trabajador) {
        console.error("Transportista no encontrado.");
        return;
      }

      const trabajadorID = trabajador.id;
      const docRef = doc(db, "metadatos/campanias");
      const campañasMetadata = await getDoc(docRef);

      if (!campañasMetadata.exists()) {
        console.error("No se encontraron campañas.");
        return;
      }

      const campañas = [...campañasMetadata.data().campañas];
      const premios: { [key: string]: Record<string, number> } = {
        [campañas[0]]: {},
        [campañas[campañas.length - 1]]: {},
      };

      Object.keys(premiosContext).forEach((p) => {
        const premio = premiosContext[p];
        const paquete = paquetesContext.find(
          (paq) => paq.id.slice(0, 10) === p
        );
        const campaña = paquete?.campaña;

        if (
          premio.transportista === trabajadorID &&
          campaña &&
          Object.keys(premios).includes(campaña)
        ) {
          // Inicializa el objeto de premios para la campaña si no existe

          // Suma los premios al objeto de la campaña correspondiente
          Object.entries(premio.premios).forEach(([key, value]) => {
            premios[campaña][key] = (premios[campaña][key] || 0) + value;
          });
        }
      });
      setModalData(
        Object.values(premios)
      );
      setIsOpenModal(true);
    } catch (error) {
      console.error("Error en openModal:", error);
    }
  };

  return (
    <>
      <ModalPremios
        isOpen={isOpenModal}
        transportista={""}
        premios={modalData}
        onConfirm={() => {
          setIsOpenModal(false);
        }}
      />
      <h2>Listado de usuarios</h2>
      <input
        type="text"
        placeholder="Buscar..."
        value={searchQuery}
        onChange={handleSearch}
      />
      <Table
        data={tableData}
        headers={[
          "Nombre",
          "Rut",
          "Correo",
          "Telefono",
          "Ultima conexión",
          "VersionApp",
        ]}
        searchTerms={searchQuery
          .split(";")
          .map((term) => normalizeString(term))} // Normaliza y divide términos
        indexCol={1}
      >
        {(row: string) => {
          return (
            <div
              onClick={() => {
                openModal(row);
              }}
            >
              <label>&#128269;</label>
            </div>
          );
        }}
      </Table>
    </>
  );
};

export default ListadoTab;
