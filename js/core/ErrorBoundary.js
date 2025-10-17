// ✅ Access React from window (since it's globally available)
const { createElement: h } = window.React || React;

export class ErrorBoundary extends window.React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('🚨 Error caught by boundary:', error, errorInfo);
        
        // Optional: Send to logging service
        this.logErrorToService(error, errorInfo);
        
        this.setState({ errorInfo });
    }

    logErrorToService(error, errorInfo) {
        // TODO: Implement error logging to SharePoint or external service
        console.log('Error logged:', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString()
        });
    }

    handleReload = () => {
        window.location.reload();
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    }

    render() {
        if (this.state.hasError) {
            return h('div', { 
                className: 'error-container',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    fontFamily: 'Inter, sans-serif',
                    backgroundColor: '#f9fafb'
                }
            },
                h('div', {
                    style: {
                        maxWidth: '600px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }
                },
                    // Error icon
                    h('div', {
                        style: {
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }
                    },
                        h('i', {
                            className: 'fas fa-exclamation-triangle',
                            style: { fontSize: '24px', color: '#dc2626' }
                        })
                    ),
                    
                    // Title
                    h('h2', {
                        style: {
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '0.5rem',
                            textAlign: 'center'
                        }
                    }, 'Er is een onverwachte fout opgetreden'),
                    
                    // Error message
                    h('p', {
                        style: {
                            fontSize: '1rem',
                            color: '#6b7280',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }
                    }, this.state.error?.message || 'Onbekende fout'),
                    
                    // Error details (collapsible)
                    this.state.errorInfo && h('details', {
                        style: {
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem',
                            color: '#4b5563'
                        }
                    },
                        h('summary', {
                            style: { cursor: 'pointer', marginBottom: '0.5rem' }
                        }, 'Technische details'),
                        h('pre', {
                            style: {
                                backgroundColor: '#f3f4f6',
                                padding: '1rem',
                                borderRadius: '6px',
                                overflow: 'auto',
                                fontSize: '0.75rem'
                            }
                        }, this.state.errorInfo.componentStack)
                    ),
                    
                    // Action buttons
                    h('div', {
                        style: {
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center'
                        }
                    },
                        h('button', {
                            onClick: this.handleReload,
                            style: {
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '1rem'
                            }
                        }, 'Pagina Vernieuwen'),
                        
                        h('button', {
                            onClick: this.handleReset,
                            style: {
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '1rem'
                            }
                        }, 'Probeer Opnieuw')
                    )
                )
            );
        }

        return this.props.children;
    }
}