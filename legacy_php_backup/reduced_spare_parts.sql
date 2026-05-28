-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2020 at 06:43 AM
-- Server version: 10.4.14-MariaDB
-- PHP Version: 7.4.9




--
-- Database: "spare_parts"
--

-- --------------------------------------------------------

--
-- Table structure for table "category"
--

CREATE TABLE "category" (
  "CATEGORY_ID" INTEGER NOT NULL,
  "CNAME" varchar(50) DEFAULT NULL
) ;

--
-- Dumping data for table "category"
--

INSERT INTO "category" ("CATEGORY_ID", "CNAME") VALUES
(1, 'Electric_parts'),
(2, 'Metal_parts'),
(3, 'Rubber_parts'),
(4, 'Tranmission_parts');

-- --------------------------------------------------------

--
-- Table structure for table "customer"
--

CREATE TABLE "customer" (
  "CUST_ID" INTEGER NOT NULL,
  "FIRST_NAME" varchar(50) DEFAULT NULL,
  "LAST_NAME" varchar(50) DEFAULT NULL,
  "PHONE_NUMBER" varchar(11) DEFAULT NULL
) ;

--
-- Dumping data for table "customer"
--

INSERT INTO "customer" ("CUST_ID", "FIRST_NAME", "LAST_NAME", "PHONE_NUMBER") VALUES
(17, 'Wanjiku', 'Mwangi', '9873635464'),
(18, 'Maina', 'Kenyatta', '8934827482'),
(19, 'Miano', 'Njeri', '9876478974'),
(20, 'Omondi', 'Oloo', '8678947353'),
(21, 'Mutinda', 'Muthoni', '7865346734');

-- --------------------------------------------------------

--
-- Table structure for table "employee"
--

CREATE TABLE "employee" (
  "EMPLOYEE_ID" INTEGER NOT NULL,
  "FIRST_NAME" varchar(50) DEFAULT NULL,
  "LAST_NAME" varchar(50) DEFAULT NULL,
  "GENDER" varchar(50) DEFAULT NULL,
  "EMAIL" varchar(100) DEFAULT NULL,
  "PHONE_NUMBER" varchar(11) DEFAULT NULL,
  "JOB_ID" INTEGER DEFAULT NULL,
  "LOCATION_ID" INTEGER DEFAULT NULL
) ;

--
-- Dumping data for table "employee"
--

INSERT INTO "employee" ("EMPLOYEE_ID", "FIRST_NAME", "LAST_NAME", "GENDER", "EMAIL", "PHONE_NUMBER", "JOB_ID", "LOCATION_ID") VALUES
(1, 'Kamau', 'Kenyatta', 'Male', 'pavan@gmail.com', '9876567865', 1, 113),
(5, 'Ochieng', 'Odinga', 'Male', 'karan@gmail.com', '89763546334', 1, 163),
(6, 'Kiprop', 'Njoroge', 'Male', 'rushi@gmail.com', '9874657834', 2, 164),
(7, 'Kipchoge', 'Mutua', 'Male', 'gopal@gmail.com', '7894653125', 2, 165);

-- --------------------------------------------------------

--
-- Table structure for table "job"
--

CREATE TABLE "job" (
  "JOB_ID" INTEGER NOT NULL,
  "JOB_TITLE" varchar(50) DEFAULT NULL
) ;

--
-- Dumping data for table "job"
--

INSERT INTO "job" ("JOB_ID", "JOB_TITLE") VALUES
(1, 'Manager'),
(2, 'Cashier');

-- --------------------------------------------------------

--
-- Table structure for table "location"
--

CREATE TABLE "location" (
  "LOCATION_ID" INTEGER NOT NULL,
  "PROVINCE" varchar(100) DEFAULT NULL,
  "CITY" varchar(100) DEFAULT NULL
) ;

--
-- Dumping data for table "location"
--

INSERT INTO "location" ("LOCATION_ID", "PROVINCE", "CITY") VALUES
(113, 'Nairobi', 'Westlands'),
(159, 'Nairobi', 'Westlands'),
(160, 'Nairobi', 'Kilimani'),
(161, 'Mombasa', 'Nyali'),
(162, 'Kisumu', 'Milimani'),
(163, 'Nairobi', 'Karen'),
(164, 'Mombasa', 'Bamburi'),
(165, 'Kisumu', 'Kondele');

-- --------------------------------------------------------

--
-- Table structure for table "manager"
--

CREATE TABLE "manager" (
  "FIRST_NAME" varchar(50) DEFAULT NULL,
  "LAST_NAME" varchar(50) DEFAULT NULL,
  "LOCATION_ID" INTEGER NOT NULL,
  "EMAIL" varchar(50) DEFAULT NULL,
  "PHONE_NUMBER" varchar(11) DEFAULT NULL
) ;

-- --------------------------------------------------------

--
-- Table structure for table "product"
--

CREATE TABLE "product" (
  "PRODUCT_ID" INTEGER NOT NULL,
  "PRODUCT_CODE" varchar(20) NOT NULL,
  "NAME" varchar(50) DEFAULT NULL,
  "DESCRIPTION" varchar(250) NOT NULL,
  "QTY_STOCK" INTEGER DEFAULT NULL,
  "ON_HAND" INTEGER NOT NULL,
  "PRICE" INTEGER DEFAULT NULL,
  "CATEGORY_ID" INTEGER DEFAULT NULL,
  "SUPPLIER_ID" INTEGER DEFAULT NULL,
  "DATE_STOCK_IN" varchar(50) NOT NULL
) ;

--
-- Dumping data for table "product"
--

INSERT INTO "product" ("PRODUCT_ID", "PRODUCT_CODE", "NAME", "DESCRIPTION", "QTY_STOCK", "ON_HAND", "PRICE", "CATEGORY_ID", "SUPPLIER_ID", "DATE_STOCK_IN") VALUES
(28, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(29, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(30, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(31, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(32, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(33, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(34, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(35, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(36, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(37, '1', 'wires', '', 1, 1, 300, 4, 19, '');

-- --------------------------------------------------------

--
-- Table structure for table "supplier"
--

CREATE TABLE "supplier" (
  "SUPPLIER_ID" INTEGER NOT NULL,
  "COMPANY_NAME" varchar(50) DEFAULT NULL,
  "LOCATION_ID" INTEGER NOT NULL,
  "PHONE_NUMBER" varchar(11) DEFAULT NULL
) ;

--
-- Dumping data for table "supplier"
--

INSERT INTO "supplier" ("SUPPLIER_ID", "COMPANY_NAME", "LOCATION_ID", "PHONE_NUMBER") VALUES
(17, 'TATA', 159, '9873647484'),
(18, 'TOYOTA', 160, '9873654783'),
(19, 'Mahindra', 161, '8765904753'),
(20, 'Suziki', 162, '8973645632');

-- --------------------------------------------------------

--
-- Table structure for table "transaction"
--

CREATE TABLE "transaction" (
  "TRANS_ID" INTEGER NOT NULL,
  "CUST_ID" INTEGER DEFAULT NULL,
  "NUMOFITEMS" varchar(250) NOT NULL,
  "SUBTOTAL" varchar(50) NOT NULL,
  "LESSVAT" varchar(50) NOT NULL,
  "NETVAT" varchar(50) NOT NULL,
  "ADDVAT" varchar(50) NOT NULL,
  "GRANDTOTAL" varchar(250) NOT NULL,
  "CASH" varchar(250) NOT NULL,
  "DATE" varchar(50) NOT NULL,
  "TRANS_D_ID" varchar(250) NOT NULL
) ;

--
-- Dumping data for table "transaction"
--

INSERT INTO "transaction" ("TRANS_ID", "CUST_ID", "NUMOFITEMS", "SUBTOTAL", "LESSVAT", "NETVAT", "ADDVAT", "GRANDTOTAL", "CASH", "DATE", "TRANS_D_ID") VALUES
(13, 20, '1', '2,500.00', '267.86', '2,232.14', '267.86', '2,500.00', '2500', '2020-11-11 04:15 am', '111141641'),
(14, 19, '2', '', '', '', '', '2,800.00', '2800', '<br />\r\n<b>Notice</b>:  Undefined variable: today ', '111151334');

-- --------------------------------------------------------

--
-- Table structure for table "transaction_details"
--

CREATE TABLE "transaction_details" (
  "ID" INTEGER NOT NULL,
  "TRANS_D_ID" varchar(250) NOT NULL,
  "PRODUCTS" varchar(250) NOT NULL,
  "QTY" varchar(250) NOT NULL,
  "PRICE" varchar(250) NOT NULL,
  "EMPLOYEE" varchar(250) NOT NULL,
  "ROLE" varchar(250) NOT NULL
) ;

--
-- Dumping data for table "transaction_details"
--

INSERT INTO "transaction_details" ("ID", "TRANS_D_ID", "PRODUCTS", "QTY", "PRICE", "EMPLOYEE", "ROLE") VALUES
(21, '111141641', 'headlights', '1', '2500', 'Kamau', 'Manager'),
(22, '111151334', 'wires', '1', '300', 'Kamau', 'Manager'),
(23, '111151334', 'headlights', '1', '2500', 'Kamau', 'Manager');

-- --------------------------------------------------------

--
-- Table structure for table "type"
--

CREATE TABLE "type" (
  "TYPE_ID" INTEGER NOT NULL,
  "TYPE" varchar(50) DEFAULT NULL
) ;

--
-- Dumping data for table "type"
--

INSERT INTO "type" ("TYPE_ID", "TYPE") VALUES
(1, 'Admin'),
(2, 'User');

-- --------------------------------------------------------

--
-- Table structure for table "users"
--

CREATE TABLE "users" (
  "ID" INTEGER NOT NULL,
  "EMPLOYEE_ID" INTEGER DEFAULT NULL,
  "USERNAME" varchar(50) DEFAULT NULL,
  "PASSWORD" varchar(50) DEFAULT NULL,
  "TYPE_ID" INTEGER DEFAULT NULL
) ;

--
-- Dumping data for table "users"
--

INSERT INTO "users" ("ID", "EMPLOYEE_ID", "USERNAME", "PASSWORD", "TYPE_ID") VALUES
(1, 1, 'admin1', '6C7CA345F63F835CB353FF15BD6C5E052EC08E7A', 1),
(2, 5, 'admin2', '315F166C5ACA63A157F7D41007675CB44A948B33', 1),
(3, 6, 'admin3', '33AAB3C7F01620CADE108F488CFD285C0E62C1EC', 2),
(4, 7, 'admin4', 'EA053D11A8AAD1CCF8C18F9241BAEB9EC47E5D64', 2);

--
-- Indexes for dumped tables
--

--
-- Indexes for table "category"
--
ALTER TABLE "category"
  ADD PRIMARY KEY ("CATEGORY_ID");

--
-- Indexes for table "customer"
--
ALTER TABLE "customer"
  ADD PRIMARY KEY ("CUST_ID");

--
-- Indexes for table "employee"
--
ALTER TABLE "employee"
  ADD PRIMARY KEY ("EMPLOYEE_ID"),
  ADD UNIQUE KEY "EMPLOYEE_ID" ("EMPLOYEE_ID"),
  ADD UNIQUE KEY "PHONE_NUMBER" ("PHONE_NUMBER"),
  ADD KEY "LOCATION_ID" ("LOCATION_ID"),
  ADD KEY "JOB_ID" ("JOB_ID");

--
-- Indexes for table "job"
--
ALTER TABLE "job"
  ADD PRIMARY KEY ("JOB_ID");

--
-- Indexes for table "location"
--
ALTER TABLE "location"
  ADD PRIMARY KEY ("LOCATION_ID");

--
-- Indexes for table "manager"
--
ALTER TABLE "manager"
  ADD UNIQUE KEY "PHONE_NUMBER" ("PHONE_NUMBER"),
  ADD KEY "LOCATION_ID" ("LOCATION_ID");

--
-- Indexes for table "product"
--
ALTER TABLE "product"
  ADD PRIMARY KEY ("PRODUCT_ID"),
  ADD KEY "CATEGORY_ID" ("CATEGORY_ID"),
  ADD KEY "SUPPLIER_ID" ("SUPPLIER_ID");

--
-- Indexes for table "supplier"
--
ALTER TABLE "supplier"
  ADD PRIMARY KEY ("SUPPLIER_ID"),
  ADD KEY "LOCATION_ID" ("LOCATION_ID");

--
-- Indexes for table "transaction"
--
ALTER TABLE "transaction"
  ADD PRIMARY KEY ("TRANS_ID"),
  ADD KEY "TRANS_DETAIL_ID" ("TRANS_D_ID"),
  ADD KEY "CUST_ID" ("CUST_ID");

--
-- Indexes for table "transaction_details"
--
ALTER TABLE "transaction_details"
  ADD PRIMARY KEY ("ID"),
  ADD KEY "TRANS_D_ID" ("TRANS_D_ID") USING BTREE;

--
-- Indexes for table "type"
--
ALTER TABLE "type"
  ADD PRIMARY KEY ("TYPE_ID");

--
-- Indexes for table "users"
--
ALTER TABLE "users"
  ADD PRIMARY KEY ("ID"),
  ADD KEY "TYPE_ID" ("TYPE_ID"),
  ADD KEY "EMPLOYEE_ID" ("EMPLOYEE_ID");

--
--  for dumped tables
--

--
--  for table "category"
--
ALTER TABLE "category"
  MODIFY "CATEGORY_ID" INTEGER NOT NULL , =10;

--
--  for table "customer"
--
ALTER TABLE "customer"
  MODIFY "CUST_ID" INTEGER NOT NULL , =22;

--
--  for table "employee"
--
ALTER TABLE "employee"
  MODIFY "EMPLOYEE_ID" INTEGER NOT NULL , =8;

--
--  for table "location"
--
ALTER TABLE "location"
  MODIFY "LOCATION_ID" INTEGER NOT NULL , =166;

--
--  for table "product"
--
ALTER TABLE "product"
  MODIFY "PRODUCT_ID" INTEGER NOT NULL , =665;

--
--  for table "supplier"
--
ALTER TABLE "supplier"
  MODIFY "SUPPLIER_ID" INTEGER NOT NULL , =21;

--
--  for table "transaction"
--
ALTER TABLE "transaction"
  MODIFY "TRANS_ID" INTEGER NOT NULL , =15;

--
--  for table "transaction_details"
--
ALTER TABLE "transaction_details"
  MODIFY "ID" INTEGER NOT NULL , =24;

--
--  for table "users"
--
ALTER TABLE "users"
  MODIFY "ID" INTEGER NOT NULL , =10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table "employee"
--
ALTER TABLE "employee"
  ADD CONSTRAINT "employee_ibfk_1" FOREIGN KEY ("LOCATION_ID") REFERENCES "location" ("LOCATION_ID"),
  ADD CONSTRAINT "employee_ibfk_2" FOREIGN KEY ("JOB_ID") REFERENCES "job" ("JOB_ID");

--
-- Constraints for table "manager"
--
ALTER TABLE "manager"
  ADD CONSTRAINT "manager_ibfk_1" FOREIGN KEY ("LOCATION_ID") REFERENCES "location" ("LOCATION_ID");

--
-- Constraints for table "product"
--
ALTER TABLE "product"
  ADD CONSTRAINT "product_ibfk_1" FOREIGN KEY ("CATEGORY_ID") REFERENCES "category" ("CATEGORY_ID"),
  ADD CONSTRAINT "product_ibfk_2" FOREIGN KEY ("SUPPLIER_ID") REFERENCES "supplier" ("SUPPLIER_ID");

--
-- Constraints for table "supplier"
--
ALTER TABLE "supplier"
  ADD CONSTRAINT "supplier_ibfk_1" FOREIGN KEY ("LOCATION_ID") REFERENCES "location" ("LOCATION_ID");

--
-- Constraints for table "transaction"
--
ALTER TABLE "transaction"
  ADD CONSTRAINT "transaction_ibfk_3" FOREIGN KEY ("CUST_ID") REFERENCES "customer" ("CUST_ID"),
  ADD CONSTRAINT "transaction_ibfk_4" FOREIGN KEY ("TRANS_D_ID") REFERENCES "transaction_details" ("TRANS_D_ID");

--
-- Constraints for table "users"
--
ALTER TABLE "users"
  ADD CONSTRAINT "users_ibfk_3" FOREIGN KEY ("TYPE_ID") REFERENCES "type" ("TYPE_ID");
COMMIT;

