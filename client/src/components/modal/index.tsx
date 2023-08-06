import React from "react"
import ReactDOM from "react-dom"

interface ModalProps {
    children: React.ReactNode;
}
const Modal = ({ children }: ModalProps) => {
  return ReactDOM.createPortal(
    <>
        {children}
    </>,
    document.body
  )
}

export default Modal