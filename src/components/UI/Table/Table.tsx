import { useNavigate } from "react-router-dom";
import classes from "./Table.module.css";
import { ReactNode } from "react";

const Table = (props: { data: string[][], headers: string[], searchTerms?: string[], redirect?: number, children? : (rowIndex: number) => ReactNode }) => {
    const navigate = useNavigate();

    const highlightMatches = (texto: string, terms: string[]): { highlightedText: string, hasMatch: boolean } => {
        const text = texto.toString();

        // Si no hay términos válidos, devuelve el texto original y sin coincidencias
        if (!terms || terms.length === 0 || terms.every((term) => term.trim() === "")) {
            return { highlightedText: text, hasMatch: true };
        }

        const escapedTerms = terms
            .map((term) => term.trim()) // Elimina espacios alrededor
            .filter((term) => term.length > 0) // Filtra términos vacíos
            .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // Escapa caracteres especiales

        if (escapedTerms.length === 0) {
            return { highlightedText: text, hasMatch: false };
        }

        // Crea una expresión regular para encontrar todas las coincidencias
        const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");

        // Reemplaza las coincidencias con un <span> que aplica una clase de estilo
        let hasMatch = false;
        const highlightedText = text.replace(regex, (match) => {
            hasMatch = true;
            return `<span class="highlight">${match}</span>`;
        });

        return { highlightedText, hasMatch };
    };

    // Filtrar las filas que contienen coincidencias
    const filteredData = props.data.filter((row) =>
        row.some((value) => {
            const { hasMatch } = highlightMatches(value, props.searchTerms || []);
            return hasMatch;
        })
    );

    return (
        <table width="100%" className={classes.table}>
            <thead className={classes.thead}>
                <tr className={classes.trHeadder}>
                    {props.headers.map((name, index) => (
                        <th key={index} className={classes.th}>{name}</th>
                    ))}
                </tr>
            </thead>
            <tbody className={classes.tbody}>
                {filteredData.map((row, rowIndex) => (
                    <tr
                        key={rowIndex}
                        className={classes.tr}
                        onClick={() => {
                            if (props.redirect !== undefined) {
                                navigate("/" + row.at(props.redirect ?? 0));
                            }
                        }}
                    >
                        {row.map((value, colIndex) => {
                            const { highlightedText } = highlightMatches(value, props.searchTerms || []);
                            return (
                                <td
                                    key={colIndex}
                                    className={classes.td}
                                    dangerouslySetInnerHTML={{
                                        __html: highlightedText,
                                    }}
                                ></td>
                            );
                        })}
                        {
                            props.children && (
                                <td className={classes.td}>{props.children(rowIndex)}</td>
                            )
                        }
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default Table;
