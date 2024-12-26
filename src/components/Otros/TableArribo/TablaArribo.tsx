import classes from "./TablaArribo.module.css";

const TablaArribo = (props: { data: (string | boolean)[][], headers: string[] }) => {
    const data = props.data.map((p) => [p[0], p[1], p[2], p[3], p[4]])

    return (
        <table width="100%" className={classes.table}>
            <thead className={classes.thead}>
                <tr className={classes.trHeadder}>
                    {props.headers.map((name, index) => (
                        <th key={index} className={classes.th}>{name}</th>
                    ))}
                </tr>
            </thead>
            <tbody className={classes.tbody}>
                {data.map((row, rowIndex) => (
                    <tr
                        key={rowIndex}
                        className={classes.tr}
                    >
                        {row.map((value, colIndex) => (
                            <td
                                key={colIndex}
                                className={classes.td}
                            >
                                {value}
                            </td>
                        ))}
                    </tr>
                ))}
                <tr className={classes.tr}>
                    <td colSpan={5}>...</td>
                </tr>
            </tbody>
        </table>
    );
};

export default TablaArribo;
