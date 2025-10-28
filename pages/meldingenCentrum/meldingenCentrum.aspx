
<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meldingencentrum</title>
    
    <!-- CSS -->
    <link rel="stylesheet" type="text/css" href="../../css/verlofrooster_s.css">
    <link rel="stylesheet" type="text/css" href="css/style.css">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossorigin="anonymous" 
          referrerpolicy="no-referrer" />
    
    <!-- React from CDN with fallback -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    
    <!-- Fallback script -->
    <script>
        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
            document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react.development.js"><\/script>');
            document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react-dom.development.js"><\/script>');
        }
    </script>
</head>
<body>
    <div id="root"></div>

    <script type="module">
        console.log('🚀 Meldingencentrum starting...');
        
        // Make React available globally
        window.React = React;
        window.ReactDOM = ReactDOM;
        
        // Import the App component
        import App from './js/ui/App.js';
        
        const { createElement: h } = React;
        
        // Use React 18 createRoot API
        const container = document.getElementById('root');
        const root = ReactDOM.createRoot(container);
        
        root.render(h(App));
        
        console.log('✅ Meldingencentrum initialized');
    </script>
</body>
</html>
