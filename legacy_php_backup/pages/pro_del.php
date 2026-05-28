
<?php
include'../includes/connection.php';
include'../includes/sidebar.php';
?><?php 


    			$query = 'DELETE FROM Product WHERE PRODUCT_ID = ' . $_GET['id'];
    			$result = $db->query($query) or die(print_r($db->errorInfo(), true));				
            ?>
    			<script type="text/javascript">alert("Spare Part Successfully Deleted.");window.location = "spare_parts.php";</script>					
            <?php
    			//break;
            
	
?>
