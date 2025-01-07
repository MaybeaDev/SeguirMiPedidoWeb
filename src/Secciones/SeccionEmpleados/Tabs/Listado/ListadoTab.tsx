import { collection, getDocs } from "firebase/firestore";
import Table from "../../../../components/UI/Table/Table"
import { db } from "../../../../firebaseConfig";
import { useEffect, useState } from "react";






const ListadoTab = () => {
    const [usuarios, setUsuarios] = useState<string[][]>([])
    const [tableData, setTableData] = useState<string[][]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const getUsers = async () => {
        const querySnapshot = await getDocs(collection(db, "Usuarios"));
        const users: string[][] = []
        querySnapshot.docs.map((doc) => {
            users.push([
                doc.data().nombre,
                doc.data().tipo === 0 ? "Transportista" : (
                    doc.data().tipo === 1 ? "Empresa" : "Desconocido..."
                ),
                doc.data().rut,
                doc.data().correo,
                doc.data().telefono,
                doc.data().ultimaConexion ? doc.data().ultimaConexion.toDate().toLocaleString() : "No registrado",
                doc.data().versionApp ?? "App antigua"
            ])
        });
        setUsuarios(users);
        setTableData(users);
    }
    useEffect(() => {
        getUsers()
    }, [])

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
    }
    const normalizeString = (str: string): string => {
        return str
            .normalize("NFD") // Descompone los caracteres con tildes en base + tilde
            .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes y diacríticos
            .replace(/[\u200B-\u200D\uFEFF]/g, "") // Elimina caracteres invisibles
            .replace(/\s+/g, " ") // Reemplaza múltiples espacios por uno solo
            .trim() // Elimina espacios al inicio y final
            .toLowerCase(); // Convierte a minúsculas
    };
    return (
        <>
            <h2>Listado de usuarios</h2>
            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={handleSearch} />
            <Table data={tableData} headers={["Nombre", "Tipo", "Rut", "Correo", "Telefono", "Ultima conexión", "VersionApp"]} 
            searchTerms={searchQuery.split(";").map((term) => normalizeString(term))} // Normaliza y divide términos
            ></Table>
        </>
    )
}

export default ListadoTab