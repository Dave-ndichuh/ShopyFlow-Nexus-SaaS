<?php
include('../includes/connection.php');
			$zz = $_POST['id'];
			$fname = $_POST['firstname'];
		    $lname = $_POST['lastname'];
			$phone = $_POST['phone'];
	   	
		
	 			$query = 'UPDATE customer set FIRST_NAME ="'.$fname.'",
					LAST_NAME ="'.$lname.'", PHONE_NUMBER="'.$phone.'" WHERE
					CUST_ID ="'.$zz.'"';
					$result = $db->query($query) or die(print_r($db->errorInfo(), true));
							
?>	
	<script type="text/javascript">
			alert("You've Update Customer Successfully.");
			window.location = "customer.php";
		</script>
