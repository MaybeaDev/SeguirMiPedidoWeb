import { getDownloadURL, getStorage, ref } from "firebase/storage";
import styles from "./EstadoPaquete.module.css";
import { db } from "../../../firebaseConfig";
import { useState, useEffect, useRef } from "react";

const EstadoPaquete = (props: { historial: { estado: string, fecha: string, detalles: string, imagelink?: string }[] }) => {
  const [imageURL, setImageURL] = useState<Record<number, string>>({});
  const imageRefCache = useRef(new Map()); // Utilizamos useRef para mantener las URLs sin causar re-render

  useEffect(() => {
    props.historial.forEach((estado, index) => {
      if (estado.imagelink && !imageRefCache.current.has(index)) {  // Si aún no está en el cache de imágenes
        const imageRef = ref(getStorage(db.app), estado.imagelink);
        getDownloadURL(imageRef).then((downloadURL) => {
          imageRefCache.current.set(index, downloadURL);  // Guardamos la URL en el cache
          setImageURL(prevState => ({ ...prevState, [index]: downloadURL }));  // Actualizamos el estado
          if (import.meta.env.DEV) console.log('Image downloaded successfully: ', downloadURL);
        });
      }
    });
  }, [props.historial]);

  return (
    <center>
      <ul className={styles.timeline} style={{ display: "flex", flex: 1, flexDirection: "column", marginBlock: 30 }}>
        {props.historial.map((estado, index) => {
          return (
            <li
              key={index}
              className={`${styles.timelineItem} ${styles.completed}`}
              style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center" }}
            >
              <h5 style={{ flex: 1 }} className={styles.h5}>
                {estado.estado}
                {imageURL[index] && (
                  <a href={imageURL[index]} target="_blank" rel="noopener noreferrer">
                    <label>🖼️</label>
                  </a>
                )}
              </h5>
              <h5 style={{ flex: 1 }} className={styles.h5}>{estado.detalles}</h5>
              <h6 style={{ flex: 1 }} className={styles.h6}>{estado.fecha}</h6>
            </li>
          );
        })}
      </ul>
    </center>
  );
};

export default EstadoPaquete;
