import classes from "./VerPaquetesTab.module.css"

import { useEffect, useRef, useState } from "react";
import Table from "../../../../components/UI/Table/Table";
import { useOutletContext, useParams } from "react-router-dom";
import { PaqueteContext, RutaContext, TransportistaContext } from "../../../../components/Otros/PrivateRoutes/PrivateRoutes";
import Button from "../../../../components/UI/Button/Button";
import * as XLSX from "xlsx";


const PUBLIC_URL = "https://rolandotransportes.cl/paquete"
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
  const { paquetesContext, rutasContext, transportistasContext } = useOutletContext<{ paquetesContext: PaqueteContext[], rutasContext: Record<string, RutaContext>, transportistasContext: Record<string, TransportistaContext> }>();
  const [paquetes, setPaquetes] = useState<string[][]>([]);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [mensajeCargando, setMensajeCargando] = useState("Obteniendo Paquetes...")
  const { query, excluir } = useParams()
  const [coincidirTodos, setCoincidirTodos] = useState(excluir ? false : true)
  const [searchQuery, setSearchQuery] = useState<string>(query ?? "");
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
  }, [paquetesContext, rutasContext, transportistasContext])

  const getPaquetes = () => {
    const paq = [...paquetesContext]
    paq.sort((a, b) => b.id.localeCompare(a.id));
    paq.sort((a, b) => b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime());
    const paquetesMapeados = paq.map((p) => {
      const ruta = rutasContext[p.ruta]
      const r = p.rutaAlias
      const t = p.transportistaNombre
      const paquete = [
        `${p.campaña ?? "C. no disponible"} <br/> F:${p.facturacion ?? "No especificada"}`,
        `Arr:${p.historial[1]?.fecha.toDate().toLocaleDateString() ?? "No arribado"}`,
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
            case 5:
              return "Devuelto";
            default:
              return "En Proceso";
          }
        })(),
        formatDate(p.historial[p.historial.length - 1].fecha.toDate()),
        p.receptor,
        p.contacto ?? "No disponible",
        p.direccion,
        r ? r : (ruta != undefined ? ruta.alias : ""),
        t ? t : (ruta != undefined ? ruta.transportistaNombre : "")

      ]
      return paquete
    })
    setIsLoading(false);
    setPaquetes(paquetesMapeados);
    filtrarTabla(searchQuery, paquetesMapeados)
  };


  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toString()
    setSearchQuery(query);
    filtrarTabla(query)
  };
  const filtrarTabla = (query: string, paq?: string[][], coincidir?: boolean) => {
    let filteredData: string[][] = []
    if (coincidir ?? coincidirTodos) {
      const searchTerms = query
        .split(";") // Divide por punto y coma
        .map((term) => normalizeString(term)) // Normaliza cada término
        .filter((term) => term.length > 0); // Elimina términos vacíos

      filteredData = paq ? paq.filter((paquete) =>
        searchTerms.every((term) =>
          paquete.some((field) =>
            normalizeString((field ?? "").toString()).includes(term)
          )
        )
      ) : paquetes.filter((paquete) =>
        searchTerms.every((term) =>
          paquete.some((field) =>
            normalizeString((field ?? "").toString()).includes(term)
          )
        )
      )
    }
    else {
      const searchTerms = query
        .split(";") // Divide por punto y coma
        .map((term) => normalizeString(term)) // Normaliza cada término
        .filter((term) => term.length > 0); // Elimina términos vacíos

      filteredData = paq ? paq.filter((paquete) =>
        searchTerms.some((term) =>
          paquete.some((field) =>
            normalizeString((field ?? "").toString()).includes(term)
          )
        )
      ) : paquetes.filter((paquete) =>
        searchTerms.some((term) =>
          paquete.some((field) =>
            normalizeString((field ?? "").toString()).includes(term)
          )
        )
      )
    }
    if (filteredData.length == 0) {
      filteredData = paq ?? paquetes
    }
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
  const handleVerCodigosDeBarra = () => {
    const codes = [...tableData.map(d => d[2]).slice(0, 500)];
    sessionStorage.setItem("codesBarcodes", JSON.stringify(codes))
    window.open(`/barcode-page`, "_blank");
  };
  const handleDescargarExcel = () => {
    const data: {
      Campaña: string,
      Facturacion: string,
      Codigo: string,
      Estado: string,
      Fecha: string,
      Consultora: string,
      NombreConsultora: string,
      Telefono: string,
      Direccion: string,
      Ruta: string,
      Transportista: string,
      Detalles: string,
    }[] = []
    tableData.forEach(row => {
      const paquete = paquetesContext.find((p) => p.id == row[2])
      if (paquete) {
        const detalles = paquete.historial[paquete.historial.length - 1].detalles
        const p = {
          Campaña: row[0].split(" <br/> F:")[0],
          Facturacion: row[0].split(" <br/> F:")[1],
          Codigo: row[2],
          Estado: row[4],
          Fecha: row[5],
          Consultora: row[3],
          NombreConsultora: row[6],
          Telefono: row[7],
          Direccion: row[8],
          Ruta: row[9],
          Transportista: row[10],
          Detalles: detalles,
        }
        data.push(p)
      }
    })
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen");
    XLSX.writeFile(workbook, "Resumen" + formatDate(new Date()) + ".xlsx");
  }

  return (
    <>
      <h2>Ver Paquetes</h2>
      <input
        type="text"
        placeholder="Buscar en los resultados..."
        value={searchQuery}
        onChange={handleSearch}
      />
      <Button onClick={() => { setCoincidirTodos(!coincidirTodos); filtrarTabla(searchQuery, undefined, !coincidirTodos) }}>{coincidirTodos ? "Coincidir todos" : "Busqueda parcial"}</Button>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", justifyContent: "center" }}>
        <h3>
          {tableData.length <= 300 ?
            `Mostrando ${tableData.length} resultados`
            :
            `Mostrando los primeros 300 de ${tableData.length} resultados`
          }
        </h3>
        <div>
          <Button onClick={handleVerCodigosDeBarra}>Ver codigos de barra (Maximo 500)</Button>
          <Button onClick={handleDescargarExcel}>Descargar Excel con los reultados</Button>
        </div>
        <br />
      </div>


      {isLoading ? (
        <div className={classes.spinnerContainer}>
          <div className={classes.spinner}></div>
          <p>{mensajeCargando}</p>
        </div>
      ) : (
        <>
          <Table
            indexCol={2}
            max={200}
            headers={[
              "Campaña / Facturacion",
              "Fecha Arribo",
              "Codigo",
              "Codigo consu.",
              "Estado",
              "Fecha",
              "Consultora",
              "Telefono",
              "Direccion",
              "Ruta",
              "Transportista",
            ]}
            data={tableData}
            searchTerms={searchQuery.split(";").map((term) => normalizeString(term))}
          >
            {(rowIndex: string) => {
              return (
                <div onClick={() => { window.open(`${PUBLIC_URL}/${rowIndex}`, "_blank") }
                }>
                  <label>&#128269;</label>
                </div>
              )
            }}
          </Table>
        </>
      )
      }
    </>
  );
};

export default VerPaquetesTab;


