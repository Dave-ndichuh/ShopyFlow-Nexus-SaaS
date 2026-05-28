<?php
include'../includes/connection.php';

	if (!isset($_GET['do']) || $_GET['do'] != 1) {
						
    	switch ($_GET['type']) {
    		case 'user':
    			$query = 'DELETE FROM users WHERE ID = ' . $_GET['id'];
    			$result = $db->query($query) or die(print_r($db->errorInfo(), true));				
            ?>
    			<script type="text/javascript">alert("User Successfully Deleted.");window.location = "user.php";</script>					
            <?php
    			//break;
            }
	}
?>
