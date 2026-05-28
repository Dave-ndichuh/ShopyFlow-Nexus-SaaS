<?php
include('../includes/connection.php');
require_once('session.php');
			$zz = $_POST['id'];
			$a = $_POST['firstname'];
            $b = $_POST['lastname'];
            $c = $_POST['gender'];
            $d = $_POST['username'];
            $e = $_POST['password'];
            $f = $_POST['email'];
            $g = $_POST['phone'];
            $i = $_POST['hireddate'];
            $j = $_POST['province'];
            $k = $_POST['city'];
		
	 			$query = 'UPDATE users u 
	 						join employee e on e.EMPLOYEE_ID=u.EMPLOYEE_ID
	 						join location l on l.LOCATION_ID=e.LOCATION_ID
	 						set e.FIRST_NAME="'.$a.'", e.LAST_NAME="'.$b.'", GENDER="'.$c.'", USERNAME="'.$d.'", PASSWORD = sha1("'.$e.'"),  EMAIL="'.$f.'", l.PROVINCE ="'.$j.'", l.CITY ="'.$k.'", PHONE_NUMBER ="'.$g.'",  ="'.$i.'" WHERE
					ID ="'.$zz.'"';
					$result = $db->query($query) or die(print_r($db->errorInfo(), true));

							
?>	
              <?php 

                $sql = 'SELECT ID
                          FROM users';
                $result2 = $db->query($sql) or die (print_r($db->errorInfo(), true));
      
                while ($row = $result2->fetch(PDO::FETCH_ASSOC)) {
                          $a = $row['ID'];
                
        if ($_SESSION['TYPE']=='Admin'){?>

             <script type="text/javascript">
                alert("You've updated your account successfully.");
                window.location = "index.php";
            </script><?php

        }elseif ($_SESSION['TYPE']=='User'){?>

            <script type="text/javascript">
                alert("You've updated your account successfully.");
                window.location = "pos.php";
            </script><?php
        }
?>

        <?php } ?>
