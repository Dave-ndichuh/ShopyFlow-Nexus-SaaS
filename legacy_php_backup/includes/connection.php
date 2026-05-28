<?php
$host = 'aws-1-eu-central-1.pooler.supabase.com';
$db   = 'postgres';
$user = 'postgres.dyoicvurrhuokfufsrwc';
$pass = 'DaveAccounts@254d';
$port = '5432';

$dsn = "pgsql:host=$host;port=$port;dbname=$db;";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $db = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
?>
