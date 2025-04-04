import { ReactNode } from "react";
import classes from "./ModalCustom.module.css"

const ModalCustom = (props: {
  isOpen: boolean;
  children: ReactNode
  style?: object;
}) => {

  if (!props.isOpen) return null;


  return (
    <div className={classes.container}>
      <div className={classes.modal} style={props.style}>
        {props.children}
      </div>
    </div>
  );
};

export default ModalCustom;
