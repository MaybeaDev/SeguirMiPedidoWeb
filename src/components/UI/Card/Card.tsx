

import { ReactNode } from "react";
import classes from "./Card.module.css"
const Card = (props: { titulo?: string, children: ReactNode, style?: object, onClick?: () => void }) => {
	return (
		<div className={classes.card} style={props.style} onClick={props.onClick ?? (() => { })}>
			<div>
				{props.titulo && <h3 className={classes.header}>{props.titulo}</h3>}
			</div>
			<div className={classes.body}>
				{props.children}
			</div>
		</div>
	)
}

export default Card;