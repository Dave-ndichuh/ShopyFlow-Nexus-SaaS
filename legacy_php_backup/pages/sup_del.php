<?php
include'../includes/connection.php';
include'../includes/sidebar.php';
?><?php 


    			$query = 'DELETE FROM supplier WHERE SUPPLIER_ID = ' . $_GET['id'];
    			$result = $db->query($query) or die(print_r($db->errorInfo(), true));				
            ?>
    			<script type="text/javascript">alert("Supplier Successfully Deleted.");window.location = "supplier.php";</script>					
            <?php
    			//break;
            
	
?>
