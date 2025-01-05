import JsBarcode from 'jsbarcode';
import Table from '../../components/UI/Table/Table';

const BarcodePage = () => {
  const codes = sessionStorage.getItem("codesBarcodes")
  const generateBarcode = (text: string): string => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "CODE128",
      height: 70, 
      width: 4, 
      margin:3,
      fontSize:20,
    });
    return canvas.toDataURL("image/png");
  };

  if (codes) {
    const data = JSON.parse(codes).map((c: string) => { return [c] })
    console.log(data)
    return (
      <div>
        <Table data={data} headers={["Codigo", "Codigo de barras"]}>
          {(rowIndex: string) => (
            <div>
              <img style={{
                marginBlock: 20,
              }}
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
