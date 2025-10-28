
const { useState, createElement: h } = React;

const FeedbackForm = ({ onSubmit, onCancel, initialData = {} }) => {
    const [title, setTitle] = useState(initialData.title || '');
    const [beschrijving, setBeschrijving] = useState(initialData.beschrijving || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!title || !beschrijving) {
            alert('Titel en beschrijving mogen niet leeg zijn.');
            return;
        }
        
        onSubmit(title, beschrijving);
    };

    return h('form', { 
        onSubmit: handleSubmit, 
        className: 'feedback-form',
        style: {
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
        }
    },
        h('h2', { 
            style: { 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                marginBottom: '1.5rem' 
            } 
        }, initialData.id ? 'Melding Bewerken' : 'Nieuwe Melding'),
        
        h('div', { style: { marginBottom: '1rem' } },
            h('label', { 
                htmlFor: 'title',
                style: {
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    color: '#374151'
                }
            }, 'Titel *'),
            h('input', {
                type: 'text',
                id: 'title',
                value: title,
                onChange: (e) => setTitle(e.target.value),
                placeholder: 'Korte omschrijving van het probleem',
                style: {
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                }
            })
        ),
        
        h('div', { style: { marginBottom: '1.5rem' } },
            h('label', { 
                htmlFor: 'beschrijving',
                style: {
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    color: '#374151'
                }
            }, 'Beschrijving van de fout *'),
            h('textarea', {
                id: 'beschrijving',
                value: beschrijving,
                onChange: (e) => setBeschrijving(e.target.value),
                placeholder: 'Geef een gedetailleerde beschrijving van het probleem, inclusief stappen om het te reproduceren',
                rows: 6,
                style: {
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                }
            })
        ),
        
        h('div', { 
            className: 'form-actions',
            style: {
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
            }
        },
            h('button', { 
                type: 'button', 
                onClick: onCancel,
                style: {
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                }
            }, 'Annuleren'),
            h('button', { 
                type: 'submit', 
                className: 'button-primary',
                style: {
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                }
            }, 'Opslaan')
        )
    );
};

export default FeedbackForm;
