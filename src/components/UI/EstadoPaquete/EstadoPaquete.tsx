import { getDownloadURL, getStorage, ref } from "firebase/storage";
import styles from "./EstadoPaquete.module.css"
import { db } from "../../../firebaseConfig";
import { useState } from "react";
const EstadoPaquete = (props: { historial: { estado: string, fecha: string, detalles: string, imagelink?: string }[] }) => {
    const [imageURL, setImageURL] = useState<Record<number, string>>({})
    return (
        <center>
            <ul className={styles.timeline} style={{ display: "flex", flex: 1, flexDirection: "column", marginBlock: 30 }}>
                {props.historial.map((estado, index) => {
                    if (estado.imagelink != undefined && estado.estado == "Entregado") {
                        const imageRef = ref(getStorage(db.app), estado.imagelink);
                        if (imageURL[index] == undefined){
                            getDownloadURL(imageRef).then((downloadURL) => {
                                const new_image_dict = {...imageURL, [index]: downloadURL }
                                setImageURL(new_image_dict);
                                console.log('Image downloaded successfully: ', downloadURL);
                            })
                        }
                    }
                    return (
                        <li
                            key={index}
                            className={`${styles.timelineItem} ${styles.completed}`}
                            style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center" }}
                        >
                            <h5 style={{ flex: 1 }} className={styles.h5}>{estado.estado}{imageURL[index] != undefined && (
                                <a href={imageURL[index]} target="_blank"><label>🖼️</label></a>
                            )}</h5>
                            <h5 style={{ flex: 1 }} className={styles.h5}>{estado.detalles}</h5>
                            <h6 style={{ flex: 1 }} className={styles.h6}>{estado.fecha}</h6>
                        </li>
                    )
                })}
            </ul>
        </center>
    );
};

export default EstadoPaquete;