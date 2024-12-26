import React, { useRef, useState } from "react";
import styles from "./FileDropzone.module.css";



const FileDropzone = (props: { onFileSelect: (data: File) => void, errorString?: string }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null); // Estado para el nombre del archivo
    const [error, setError] = useState<string | null>(null); // Estado para mensajes de error
    const inputRef = useRef<HTMLInputElement>(null)

    if (props.errorString && error != props.errorString) {
        setError(props.errorString);
    }
    const validateFile = (file: File) => {
        console.log(file)
        if (
            file.type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.type == "application/vnd.ms-excel"
        ) {
            setFileName(file.name.split(".")[0]);
            inputRef.current!.title = file.name.split(".")[0]
            setError(null);
            props.onFileSelect(file);
        } else {
            setError("Por favor, suba un archivo Excel válido (.xls o .xlsx)");
        }
        inputRef.current!.value = ""
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            validateFile(file)
        }
    };

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("input event")
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            validateFile(file)
        }
    };


    return (
        <div
            className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                ref={inputRef}
                id="InputFileElement"
                type="file"
                accept=".xls,.xlsx" // Solo permite archivos Excel
                className={styles.fileInput}
                onChange={handleFileInputChange}
            />
            {error ? <p className={styles.error}>{error}</p> :
                <p>
                    {fileName
                        ? `Archivo '${fileName}' seleccionado`
                        : isDragging
                            ? "Suelte el archivo aquí"
                            : "Arrastre un archivo Excel aquí o presione para seleccionarlo"}
                </p>
            }
        </div>
    );
};

export default FileDropzone;
