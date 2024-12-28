import classes from "./VerPaquetesTab.module.css"

import { useEffect, useRef, useState } from "react";
import Table from "../../../../components/UI/Table/Table";
import { useOutletContext } from "react-router-dom";
import { PaqueteContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";
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
    const { paquetesContext } = useOutletContext<{ paquetesContext: PaqueteContext[] | [] }>();
    const [paquetes, setPaquetes] = useState<string[][]>([]);
    const [tableData, setTableData] = useState<string[][]>([]);
    const [isLoading, setIsLoading] = useState(true)
    const [mensajeCargando, setMensajeCargando] = useState("Obteniendo Paquetes...")
    const [searchQuery, setSearchQuery] = useState<string>("");
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current && paquetesContext.length == 0) {
            isFirstRender.current = false;
            return;
        }
        setTimeout(() => {
            setMensajeCargando("Está tomando mas tiempo de lo esperado debido a la conexión a internet...")
            setTimeout(() => {
                setMensajeCargando("Deberías considerar revisar tu conexion a internet...")
            }, 5000)
        }, 2000)
        getPaquetes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paquetesContext])

    const getPaquetes = () => {
        console.log(paquetesContext[1])
        const paq = [...paquetesContext]
        paq.sort((a, b) => b.id.localeCompare(a.id));
        paq.sort((a, b) => b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime());
        const paquetesMapeados = paq.map((p) => [
            p.campaña,
            p.id,
            p.consultora,
            (() => {
                switch (p.estado) {
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
            formatDate(p.historial[p.historial.length - 1].fecha.toDate()),
            p.receptor,
            p.contacto,
            p.direccion,
            p.referencia,
            p.rutaAlias,
            p.transportistaNombre

        ])
        setIsLoading(false);
        setPaquetes(paquetesMapeados);
        setTableData(paquetesMapeados);
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

    return (
        <>
            <h2>Ver Paquetes</h2>
            <input
                type="text"
                placeholder="Buscar en los resultados..."
                value={searchQuery}
                onChange={handleSearch}
            />
            {tableData.length > 300 ? (
                <h3>{`Mostrando los primeros 300 de ${tableData.length} resultados`}</h3>

            ) : (
                <h3>{`Mostrando ${tableData.length} resultados`}</h3>
            )}

            {isLoading ? (
                <div className={classes.spinnerContainer}>
                    <div className={classes.spinner}></div>
                    <p>{mensajeCargando}</p>
                </div>
            ) : (

                <Table
                    max={200}
                    headers={[
                        "Campaña",
                        "Codigo",
                        "Codigo consu.",
                        "Estado",
                        "Fecha",
                        "Consultora",
                        "Telefono",
                        "Direccion",
                        "Referencia",
                        "Ruta",
                        "Transportista",
                    ]}
                    data={tableData}
                    searchTerms={searchQuery.split(";").map((term) => normalizeString(term))}
                />
            )}
        </>
    );
};

export default VerPaquetesTab;


