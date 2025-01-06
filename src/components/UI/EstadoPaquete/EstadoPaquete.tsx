import styles from "./EstadoPaquete.module.css"
const EstadoPaquete = (props: { historial: { estado: string, fecha: string, detalles: string }[] }) => {
    return (
        <center>

            <ul className={styles.timeline} style={{ display: "flex", flex: 1, flexDirection: "column", marginBlock: 30}}>

                {props.historial.map((estado, index) => (
                    <li
                        key={index}
                        className={`${styles.timelineItem} ${styles.completed}`}
                        style={{ display: "flex", flexDirection: "column", flex:1, justifyContent: "center", alignItems: "center"}}
                    >
                        <h5 style={{ flex: 1 }} className={styles.h5}>{estado.estado}</h5>
                        <h5 style={{ flex: 1 }} className={styles.h5}>{estado.detalles}</h5>
                        <h6 style={{ flex: 1 }} className={styles.h6}>{estado.fecha}</h6>
                    </li>
                ))}
            </ul>
        </center>
    );
};

export default EstadoPaquete;