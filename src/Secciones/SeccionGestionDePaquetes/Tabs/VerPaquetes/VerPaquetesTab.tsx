import { useEffect, useState } from "react";
import Table from "../../../../components/UI/Table/Table";
import { db } from "../../../../firebaseConfig";
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
function formatDate(date: Date) {
    const day = String(date.getDate()).padStart(2, '0'); // Asegura que el día tiene 2 dígitos
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 (enero) a 11 (diciembre), por eso sumamos 1
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0'); // Asegura que las horas tienen 2 dígitos
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Asegura que los minutos tienen 2 dígitos

    // Formato dd/mm/yyyy hh:mm
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
const VerPaquetesTab = () => {
    const [paquetes, setPaquetes] = useState<string[][]>([]);
    const [tableData, setTableData] = useState<string[][]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const getPaquetes = async () => {

        const q = query(collection(db, "Paquetes"), orderBy("ruta"));
        onSnapshot(q, async (querySnapshot) => {
            const q2 = query(collection(db, "Rutas"))
            const ruta: { [key: string]: { alias: string, transportista: string } } = {}
            const rutas = await getDocs(q2)
            rutas.forEach((r) => {
                ruta[r.id] = { alias: r.data().alias, transportista: r.data().transportista }
            })

            const q3 = query(collection(db, "Usuarios"), where("tipo", "==", 0))
            const transp: { [key: string]: { nombre: string } } = {}
            const transportistas = await getDocs(q3)
            transportistas.forEach((t) => {
                transp[t.id] = { nombre: t.data().nombre }
            })
            const paquetes: string[][] = [];
            querySnapshot.forEach((doc) => {
                const paquete = [
                    doc.id,
                    doc.data().consultora,
                    formatDate(doc.data().historial[0].fecha.toDate()),
                    (() => {
                        const estado = doc.data().historial[doc.data().historial.length - 1].estado;
                        switch (estado) {
                            case 0:
                                return "Enviado desde Santiago"
                            case 1:
                                return "En Bodega";
                            case 2:
                                return "En Reparto";
                            case 3:
                                return "Entregado";
                            case 4:
                                return "Entrega fallida";
                            default:
                                return "En Proceso";
                        }
                    })(),
                    doc.data().receptor,
                    doc.data().contacto,
                    doc.data().direccion,
                    doc.data().referencia ?? "",
                ];

                if (doc.data().ruta) {
                    paquete.push(ruta[doc.data().ruta].alias);
                    if (ruta[doc.data().ruta].transportista) {
                        const transportista = transp[ruta[doc.data().ruta].transportista]
                        console.log(transportista, transp)
                        paquete.push(transportista.nombre);
                    } else {
                        paquete.push("")
                    }
                }
                else {
                    paquete.push("")
                    paquete.push("")
                }


                paquetes.push(paquete);
            });
            setPaquetes(paquetes);
            setTableData(paquetes); // Inicializa la tabla con todos los datos.
        });
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value.toString();
        setSearchQuery(query);
    
        // Divide el query en términos usando ';' y normaliza cada término
        const searchTerms = query
            .split(";") // Divide por punto y coma
            .map((term) => normalizeString(term)) // Normaliza cada término
            .filter((term) => term.length > 0); // Elimina términos vacíos
    
        const filteredData = paquetes.filter((paquete) =>
            // Cada término debe coincidir en al menos un campo del paquete
            searchTerms.every((term) =>
                paquete.some((field) =>
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
    
    


    useEffect(() => {
        getPaquetes();
    }, []);

    return (
        <>
            <h2>Ver Paquetes</h2>
            <div>
                <input
                    type="text"
                    placeholder="Buscar un paquete..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>
            <Table
                headers={[
                    "Codigo",
                    "Codigo consu.",
                    "Fecha arribo",
                    "Estado",
                    "Consultora",
                    "Telefono",
                    "Direccion",
                    "Referencia",
                    "Ruta",
                    "Transportista",
                ]}
                data={tableData}
                searchTerms={searchQuery.split(";").map((term) => normalizeString(term))} // Normaliza y divide términos
                redirect={0}
            />
        </>
    );
};

export default VerPaquetesTab;
