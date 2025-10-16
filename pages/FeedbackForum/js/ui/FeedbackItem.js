import { updateFeedbackItem, deleteFeedbackItem } from '../services/sp-service.js';
import { config } from '../config/config.js';

const { useState, createElement: h } = React;

const FeedbackItem = ({ item, isPrivileged, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newResponse, setNewResponse] = useState("");

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleDelete = async () => {
        if (confirm('Weet je zeker dat je dit feedbackitem wilt verwijderen?')) {
            try {
                await deleteFeedbackItem(item.Id);
                onUpdate();
            } catch (error) {
                console.error('Fout bij verwijderen:', error);
            }
        }
    };

    const handleResponseSubmit = async () => {
        const currentUser = _spPageContextInfo.userDisplayName;
        const now = new Date().toLocaleString('nl-NL');
        const responseText = `${currentUser} (${now}):\n${newResponse}`;
        const updatedResponses = item.Antwoorden ? `${item.Antwoorden}\n\n---\n\n${responseText}` : responseText;

        try {
            await updateFeedbackItem(item.Id, { Antwoorden: updatedResponses });
            setNewResponse("");
            onUpdate();
        } catch (error) {
            console.error('Fout bij toevoegen van antwoord:', error);
        }
    };

    const handleStatusChange = async (e) => {
        try {
            await updateFeedbackItem(item.Id, { Status: e.target.value });
            onUpdate();
        } catch (error) {
            console.error('Fout bij status wijzigen:', error);
        }
    };

    const renderResponses = () => {
        if (!item.Antwoorden) return null;
        return item.Antwoorden.split('\n\n---\n\n').map((response, index) => {
            const [firstLine, ...rest] = response.split('\n');
            const match = firstLine.match(/(.*) \((.*)\):/);
            const author = match ? match[1] : 'Anoniem';
            const date = match ? match[2] : 'Onbekende datum';
            const text = rest.join('\n');

            return h('div', { key: index, className: 'response-item' },
                h('div', { className: 'response-header' },
                    h('span', { className: 'response-author' }, author),
                    h('span', { className: 'response-date' }, date)
                ),
                h('p', { className: 'response-text' }, text)
            );
        });
    };

    return h('div', { className: 'feedback-item' },
        h('div', { className: 'feedback-header', onClick: toggleExpand },
            h('span', { className: 'feedback-title' }, item.Title),
            h('span', { className: `feedback-status status-${item.Status.toLowerCase().replace(' ', '-')}` }, item.Status)
        ),
        isExpanded && h('div', { className: 'feedback-body' },
            h('p', { className: `feedback-content ${!isExpanded && 'truncated'}` }, item.Feedback),
            h('div', { className: 'feedback-meta' }, `Ingezonden door: ${item.Author.Title}`),
            h('div', { className: 'feedback-actions' },
                isPrivileged && h('select', { onChange: handleStatusChange, value: item.Status },
                    config.statusOptions.map(opt => h('option', { key: opt, value: opt }, opt))
                ),
                h('button', { className: 'button-danger', onClick: handleDelete }, 'Verwijderen')
            ),
            h('div', { className: 'response-area' },
                h('h4', null, 'Antwoorden'),
                h('div', { className: 'response-history' }, renderResponses()),
                isPrivileged && h('div', { className: 'response-form' },
                    h('textarea', {
                        placeholder: 'Schrijf een antwoord...',
                        value: newResponse,
                        onChange: (e) => setNewResponse(e.target.value)
                    }),
                    h('button', { className: 'button-primary', onClick: handleResponseSubmit }, 'Antwoord Toevoegen')
                )
            )
        )
    );
};

export default FeedbackItem;
