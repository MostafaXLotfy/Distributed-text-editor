import React from 'react'
import {useNavigate} from 'react-router-dom'
import '../css/DocumentCard.css'
import documentImage from '../media/document.png'


const DocumentCard = (props)=>{
    const title = props.title
    const _id = props._id
    const navigate = useNavigate()
    const handle_click =(event)=>{
	if (event.detail === 2){
	    navigate(`/Editor/${_id}`)
	}
    }
    return(
	<div className='card-container' onClick={handle_click}>
	    <img src={documentImage} title={title} alt={title}/>
	    <p>{title}</p>
	</div>
    )
}

export default DocumentCard
