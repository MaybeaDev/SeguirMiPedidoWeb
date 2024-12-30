import classes from "./ModalRutas.module.css"


import { useEffect, useState } from "react";
import { RutaContext } from "../../Otros/PrivateRoutes/PrivateRoutes";
const ModalRutas = (props: {
    isOpen: boolean;
    onClose: () => void;
    paquetes: { codigo: string }[];
    onConfirm: (ruta: { rutaId: string | null, alias: string | null }) => void;
    rutas : Record<string, RutaContext>
}) => {
    const [rutas, setRutas] = useState<{ id: string, alias: string }[]>([])
    const [isNuevaRuta, setNuevaRuta] = useState<boolean>(true)
    const [inputValue, setInputValue] = useState("")
    const [validInput, setValidInput] = useState(false)
    const [ruta, setRuta] = useState<{ rutaId: string | null, alias: string | null }>({ rutaId: null, alias: null })

    const getRutas = async (): Promise<void> => {
        const rutas = Object.values(props.rutas).map((r) => {
            return {
                id:r.id,
                alias:r.alias
            }
        })
        setRutas(rutas);
    };

    useEffect(() => {
        getRutas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.rutas]);


    const handleConfirmar = () => {
        if (validInput) {
            props.onConfirm(ruta)
            props.onClose(); // Cierra el modal
        }
    };
    const handleOnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        if (event.target.value == "") {
            setNuevaRuta(true);
            setInputValue("");
            setRuta({ rutaId: null, alias: "" })
            setValidInput(false);
        } else {
            setRuta({ rutaId: event.target.value, alias: null })
            setValidInput(true)
            setNuevaRuta(false);
        }
    }
    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        setRuta({ rutaId: null, alias: event.target.value })
        if (event.target.value == "") {
            setValidInput(false);
        } else {
            setValidInput(true);
        }
    }
    if (!props.isOpen) return null;
    return (
        <div className={classes.modalOverlay}>
            <div className={classes.modalContent}>
                <button className={classes.closeButton} onClick={props.onClose}>
                    &times;
                </button>
                <h2>Asignar paquetes a la ruta:</h2>
                <select onChange={handleOnChange}>
                    <option value="">Nueva ruta</option>
                    {rutas.map((ruta) => (
                        <option key={ruta.id} value={ruta.id}>
                            {ruta.alias}
                        </option>
                    ))}
                </select>
                {isNuevaRuta &&
                    <>
                        <input type="text" value={inputValue} onInput={handleInput} placeholder="Asigna un nombre autodescriptivo..."/>
                    </>
                }
                <button disabled={!validInput} className={validInput ? classes.confirmButton : classes.confirmButtonDanger} onClick={handleConfirmar}>
                    Confirmar Ruta
                </button>
            </div>
        </div>
    );
};

export default ModalRutas;
