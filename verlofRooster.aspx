<!DOCTYPE html>
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verlofrooster</title>
    
    <!-- CSS bestanden -->
    <link href="css/verlofrooster_s.css" rel="stylesheet">
    <link href="css/verlofrooster_s1.css" rel="stylesheet">
    <link href="css/mededelingen.css" rel="stylesheet">
    <link href="css/zittingsvrij-dagdeel.css" rel="stylesheet">
    <link rel="icon" href="icons/favicon/favicon.svg" />
    
    <!-- ✨ Font Awesome voor iconen -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossorigin="anonymous" 
          referrerpolicy="no-referrer" />

    <!-- React en configuratie bestanden -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    
    <!-- Fallback script -->
    <script>
        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
            document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react.development.js"><\/script>');
            document.write('<script src="https://som.org.om.local/sites/MulderT/SBeheer/CPW/L/react-dom.development.js"><\/script>');
        }
    </script>
    <script src="js/config/configLijst.js"></script>
</head>
<body>
    <div id="root"></div>

    <!-- Application entry point -->
    <script type="module" src="js/app.js"></script>
</body>
</html>
