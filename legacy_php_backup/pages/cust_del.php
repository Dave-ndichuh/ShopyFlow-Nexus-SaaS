<?php
include'../includes/connection.php';
include'../includes/sidebar.php';
?><?php 


    			$query = 'DELETE FROM customer WHERE CUST_ID = ' . $_GET['id'];
    			$result = $db->query($query) or die(print_r($db->errorInfo(), true));				
            ?>
    			<script type="text/javascript">alert("Customer Successfully Deleted.");window.location = "customer.php";</script>					
            <?php
    			//break;
            
	
?>
