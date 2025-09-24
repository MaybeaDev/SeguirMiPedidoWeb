import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

export function downloadManifest(
  data: Record<string, number>,
  ruta: string,
  name = "manifiesto_premios"
) {
  // Encabezado
  const header = new Paragraph({
    children: [
      new TextRun({ text: "Manifiesto de Premios", bold: true, size: 32 }),
      new TextRun({ text: ` - ${ruta}`, bold: true, size: 32 }),
    ],
    spacing: { after: 300 },
  });

  // Tabla con encabezados
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Premio", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Cantidad", bold: true })],
              }),
            ],
          }),
        ],
      }),
      // Filas dinámicas a partir del objeto
      ...Object.entries(data).map(
        ([premio, cantidad]) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph(premio)],
              }),
              new TableCell({
                children: [new Paragraph(cantidad.toString())],
              }),
            ],
          })
      ),
    ],
  });

  // Pie con firma
  const footer = new Paragraph({
    text: "Recibe conforme: __________________________",
    spacing: { before: 300 },
  });
  const fecha = new Date().toLocaleDateString("es-CL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

// Fecha debajo de la firma
const fechaParagraph = new Paragraph({
  children: [
    new TextRun({
      text: `Fecha: ${fecha}`,
      italics: true,
    }),
  ],
  spacing: { before: 100 },
});

  // Documento final
  const doc = new Document({
    sections: [
      {
        children: [header, table, footer, fechaParagraph],
      },
    ],
  });

  // Generar y descargar
  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `${name}_${ruta}_${new Date().toLocaleString()}.docx`);
  });
}
