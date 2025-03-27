import Button from "../../UI/Button/Button";
import Table from "../../UI/Table/Table";

import classes from "./ModalPremios.module.css";

const ModalPremios = (props: {
  isOpen: boolean;
  ruta?: string;
  transportista?: string;
  titulo?: string;
  subtitulo?: string;
  premios: Record<string, number>[];
  paquetes?: number[];
  onConfirm: () => void;
}) => {
  if (!props.isOpen) return null;

  const headers = ["Premio", "Cantidad"];
  const data = props.premios.map((campaña) => {
    return Object.entries(campaña).map(([premio, cantidad]) => [
      premio,
      cantidad.toString(),
    ]);
  });

  const handleConfirmar = () => {
    props.onConfirm();
  };

  return (
    <div className={classes.modal}>
      <div className={classes.modalContent}>
        {props.titulo ? (
          <h2 style={{ marginBottom: 0 }}>{props.titulo}</h2>
        ) : (
          <></>
        )}
        {props.subtitulo ? <h3>{props.subtitulo}</h3> : <></>}
        {props.ruta ? <h1>Ruta: {props.ruta}</h1> : <></>}
        {data.length == 1 ? (
          <>
            <Table data={data[0]} headers={headers}></Table>
          </>
        ) : data.length == 2 ? (
          <>
            <label>Campaña anterior {props.paquetes != undefined && `(${props.paquetes[0]} paquetes entregados)` }</label>
            <Table data={data[0]} headers={headers}></Table>
            <label>Campaña actual {props.paquetes != undefined && `(${props.paquetes[1]} paquetes entregados)` }</label>
            <Table data={data[1]} headers={headers}></Table>
          </>
        ) : (
          <label>raaaro</label>
        )}

        <div className={classes.modalActions}>
          <Button onClick={handleConfirmar}>Continuar y Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

export default ModalPremios;
