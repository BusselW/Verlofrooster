
const { useState, createElement: h } = React;

const FeedbackForm = ({ onSubmit, onCancel, initialData = {} }) => {
    const [title, setTitle] = useState(initialData.title || '');
    const [feedback, setFeedback] = useState(initialData.feedback || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !feedback) {
            alert('Titel en feedback mogen niet leeg zijn.');
            return;
        }
        onSubmit(title, feedback);
    };

    return h('form', { onSubmit: handleSubmit, className: 'feedback-form' },
        h('h2', null, initialData.id ? 'Feedback Bewerken' : 'Nieuwe Feedback'),
        h('div', null,
            h('label', { htmlFor: 'title' }, 'Titel'),
            h('input', {
                type: 'text',
                id: 'title',
                value: title,
                onChange: (e) => setTitle(e.target.value)
            })
        ),
        h('div', null,
            h('label', { htmlFor: 'feedback' }, 'Feedback'),
            h('textarea', {
                id: 'feedback',
                value: feedback,
                onChange: (e) => setFeedback(e.target.value)
            })
        ),
        h('div', { className: 'form-actions' },
            h('button', { type: 'submit', className: 'button-primary' }, 'Opslaan'),
            h('button', { type: 'button', onClick: onCancel }, 'Annuleren')
        )
    );
};

export default FeedbackForm;
