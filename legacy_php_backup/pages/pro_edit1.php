<?php
include('../includes/connection.php');
			$zz = $_POST['id'];
			$pc = $_POST['prodcode'];
			$pname = $_POST['prodname'];
            $desc = $_POST['description'];
            $pr = $_POST['price'];
            $cat = $_POST['category'];
		
	 			$query = 'UPDATE product set NAME="'.$pname.'",
					DESCRIPTION="'.$desc.'", PRICE="'.$pr.'", CATEGORY_ID ="'.$cat.'" WHERE
					PRODUCT_CODE ="'.$pc.'"';
					$result = $db->query($query) or die(print_r($db->errorInfo(), true));

							
?>	
	<script type="text/javascript">
			alert("You've Update Product Successfully.");
			window.location = "spare_parts.php";
		</script>
