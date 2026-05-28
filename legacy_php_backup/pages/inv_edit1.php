<?php
include('../includes/connection.php');
			$zz = $_POST['idd'];
            $a = $_POST['qty'];
            $b = $_POST['oh'];
		
	 			$query = 'UPDATE product set QTY_STOCK="'.$a.'", ON_HAND="'.$b.'" WHERE
					PRODUCT_ID ="'.$zz.'"';
					$result = $db->query($query) or die(print_r($db->errorInfo(), true));
?>	
	<script type="text/javascript">
			alert("You've Update Product Successfully.");
			window.location = "inventory.php";
		</script>
