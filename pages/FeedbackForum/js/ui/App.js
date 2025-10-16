
import { getFeedbackItems, isCurrentUserPrivileged, addFeedbackItem } from '../services/sp-service.js';
import FeedbackItem from './FeedbackItem.js';
import FeedbackForm from './FeedbackForm.js';

const { useState, useEffect, createElement: h } = React;

const App = () => {
    const [feedbackItems, setFeedbackItems] = useState([]);
    const [isPrivileged, setIsPrivileged] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const loadFeedback = async () => {
        try {
            const items = await getFeedbackItems();
            setFeedbackItems(items);
        } catch (error) {
            console.error("Fout bij het laden van feedback:", error);
        }
    };

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const privileged = await isCurrentUserPrivileged();
                setIsPrivileged(privileged);
            } catch (error) {
                console.error("Fout bij het controleren van permissies:", error);
            }
        };

        Promise.all([loadFeedback(), checkPermissions()]).then(() => setLoading(false));
    }, []);

    const handleFormSubmit = async (title, feedback) => {
        try {
            await addFeedbackItem(title, feedback);
            await loadFeedback(); // Refresh list
            setShowForm(false);
        } catch (error) {
            console.error("Fout bij het toevoegen van feedback:", error);
        }
    };

    if (loading) {
        return h('div', null, 'Laden...');
    }

    return h('div', { className: 'feedback-container' },
        h('h1', null, 'Feedback Forum'),
        !showForm && h('button', {
            className: 'button-primary',
            onClick: () => setShowForm(true)
        }, 'Nieuwe Feedback Toevoegen'),
        showForm && h(FeedbackForm, {
            onSubmit: handleFormSubmit,
            onCancel: () => setShowForm(false)
        }),
        h('div', { className: 'feedback-list' },
            feedbackItems.map(item =>
                h(FeedbackItem, { key: item.Id, item, isPrivileged, onUpdate: loadFeedback })
            )
        )
    );
};

export default App;
