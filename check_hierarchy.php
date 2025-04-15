<?php
$conn = new mysqli('localhost', 'root', '', 'schrauberverwaltung');

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$query = "
    SELECT a1.name as asset, 
           a2.name as parent, 
           a3.name as grandparent
    FROM asset a1 
    LEFT JOIN asset a2 ON a1.id_parent = a2.id_Asset
    LEFT JOIN asset a3 ON a2.id_parent = a3.id_Asset
    WHERE a1.name = 'gh4'
";

$result = $conn->query($query);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "Hierarchy:\n";
    echo "Asset: " . $row['asset'] . "\n";
    echo "Parent: " . $row['parent'] . "\n";
    echo "Grandparent: " . $row['grandparent'] . "\n";
} else {
    echo "No results found";
}

$conn->close();
?> 