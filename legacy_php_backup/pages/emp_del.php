<?php
include'../includes/connection.php';
include'../includes/sidebar.php';
?><?php 


    			$query = 'DELETE FROM employee WHERE EMPLOYEE_ID = ' . $_GET['id'];
    			$result = $db->query($query) or die(print_r($db->errorInfo(), true));				
            ?>
    			<script type="text/javascript">alert("Employee Successfully Deleted.");window.location = "employee.php";</script>					
            <?php
    			//break;
            
	
?>
