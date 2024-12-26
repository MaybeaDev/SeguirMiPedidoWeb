import classes from "./ModalArribo.module.css";

const ModalArribo = (props: {
    isOpen: boolean;
    onClose: () => void;
    paquetes: { codigo: string }[];
    onConfirm: () => void;
}) => {

    if (!props.isOpen) return null;

    const handleConfirmar = () => {
        props.onConfirm();
        props.onClose();
    };

    return (
        <div className={classes.modalOverlay}>
            <div className={classes.modalContent}>
                <button className={classes.closeButton} onClick={props.onClose}>
                    &times;
                </button>
                <h2>¿Ingresar Paquetes?</h2>
                <button className={classes.confirmButton} onClick={handleConfirmar}>
                        Confirmar Carga
                    </button>

            </div>
        </div>
    );
};

export default ModalArribo;
