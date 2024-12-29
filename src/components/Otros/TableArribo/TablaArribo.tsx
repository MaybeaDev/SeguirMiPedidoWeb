import classes from "./TablaArribo.module.css";

const TablaArribo = (props: { data: (string | boolean)[][], headers: string[] }) => {
    const data = props.data.map((p) => [p[0], p[1], p[2], p[3], p[4], p[5]]);

    return (
        <table width="100%" className={classes.table}>
            <thead className={classes.thead}>
                <tr className={classes.trHeadder}>
                    {props.headers.map((name, index) => (
                        <th key={index} className={classes.th}>
                            {name}
                            {index === 0 && (
                                <>
                                    <br />{`total: ${data.length}`}
                                </>
                            )}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className={classes.tbody}>
                {data.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex} className={classes.tr}>
                        {row.map((value, colIndex) => (
                            <td key={`${rowIndex}-${colIndex}`} className={classes.td}>
                                {value}
                            </td>
                        ))}
                    </tr>
                ))}
                {data.length > 10 && (
                    <tr className={classes.trPlaceHolder}>
                        <td colSpan={6}>{`${data.length - 10} más...`}</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default TablaArribo;
