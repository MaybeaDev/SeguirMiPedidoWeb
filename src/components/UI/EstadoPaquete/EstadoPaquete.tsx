import styles from "./EstadoPaquete.module.css"
const EstadoPaquete = (props: { historial: { estado: string, fecha: string, detalles: string }[] }) => {
    return (
        <center>

            <ul className={styles.timeline}>
                {props.historial.map((estado, index) => (
                    <li
                        key={index}
                        className={`${styles.timelineItem} ${styles.completed}`}
                    >
                        <h5 className={styles.h5}>{estado.estado}</h5>
                        <h5 className={styles.h5}>{estado.detalles}</h5>
                        <h6 className={styles.h6}>{estado.fecha}</h6>
                    </li>
                ))}
            </ul>
        </center>
    );
};

export default EstadoPaquete;