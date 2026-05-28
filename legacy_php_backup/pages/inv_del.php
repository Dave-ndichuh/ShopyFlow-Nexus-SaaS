<?php
include'../includes/connection.php';
          
	if (!isset($_GET['do']) || $_GET['do'] != 1) {
						
    	switch ($_GET['type']) {
    		case 'product':
    			$query = 'DELETE FROM product WHERE PRODUCT_ID = ' . $_GET['id'];
    			$result = $db->query($query) or die(print_r($db->errorInfo(), true));				
            ?>
    			<script type="text/javascript">alert("Product Successfully Deleted.");window.location = "inventory.php";</script>					
            <?php
    			//break;
            }
	}
?>
