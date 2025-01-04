import JsBarcode from 'jsbarcode';
import Table from '../../components/UI/Table/Table';

const BarcodePage = () => {
  const codes = sessionStorage.getItem("codesBarcodes")
  const generateBarcode = (text: string): string => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, { format: "CODE128" });
    return canvas.toDataURL("image/png");
  };

  if (codes) {
    const data = JSON.parse(codes).map((c:string) => {return [c]})
    console.log(data)
    return (
      <div>
        <Table data={data} headers={["Codigo", "Codigo de barras"]}>
          {(rowIndex: string) => (
            <div>
              <img width={250} height={70}
                src={generateBarcode(rowIndex)}
              />
            </div>
          )}
        </Table>
      </div>
    );
  } else {
    return <div>No hay códigos de barras disponibles</div>;
  }

};

export default BarcodePage;
