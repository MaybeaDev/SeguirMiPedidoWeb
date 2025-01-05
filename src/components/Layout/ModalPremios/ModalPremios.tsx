import Button from "../../UI/Button/Button";
import Table from "../../UI/Table/Table";


import classes from "./ModalPremios.module.css";

const ModalPremios = (props: {
  isOpen: boolean;
  ruta: string;
  premios: Record<string, number>;
  onConfirm: () => void;
}) => {
  if (!props.isOpen) return null;

  // Transformar los premios en formato para la tabla
  const headers = ["Premio", "Cantidad"];
  const data = Object.entries(props.premios).map(([premio, cantidad]) => [
    premio,
    cantidad.toString(),
  ]);

  const handleConfirmar = () => {
    props.onConfirm();
  };

  return (
    <div className={classes.modal}>
      <div className={classes.modalContent}>
        <h2>Esta es la ultima oportunidad para visualizar los premios de los paquetes que estás agregando<br/><h3>Toma una captura de pantalla</h3></h2>
        <h1>Ruta: {props.ruta}</h1>
        <Table data={data} headers={headers} />
        <div className={classes.modalActions}>
          <Button onClick={handleConfirmar}>
            Continuar y Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalPremios;
