import React from 'react'

interface ButtonProps {
    type: "button" | "submit" | "reset" | undefined;
    children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ type, children }) => {
  return (
    <button 
        className='border py-2.5 rounded-md bg-green-500 text-white hover:bg-green-500/90 shadow'
        type={type}>
        {children}
    </button>
  )
}

export default Button