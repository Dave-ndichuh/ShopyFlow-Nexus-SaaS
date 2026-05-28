CREATE TABLE category (
  "CATEGORY_ID" SERIAL PRIMARY KEY,
  "CNAME" varchar(50) DEFAULT NULL
);

INSERT INTO category ("CATEGORY_ID", "CNAME") VALUES
(1, 'Electric_parts'), (2, 'Metal_parts'), (3, 'Rubber_parts'), (4, 'Tranmission_parts');

CREATE TABLE location (
  "LOCATION_ID" SERIAL PRIMARY KEY,
  "PROVINCE" varchar(100) DEFAULT NULL,
  "CITY" varchar(100) DEFAULT NULL
);

INSERT INTO location ("LOCATION_ID", "PROVINCE", "CITY") VALUES
(113, 'Nairobi', 'Westlands'), (160, 'Nairobi', 'Kilimani'), 
(161, 'Mombasa', 'Nyali'), (162, 'Kisumu', 'Milimani'),
(163, 'Nairobi', 'Karen'), (164, 'Mombasa', 'Bamburi'), 
(165, 'Kisumu', 'Kondele');

CREATE TABLE job (
  "JOB_ID" SERIAL PRIMARY KEY,
  "JOB_TITLE" varchar(50) DEFAULT NULL
);

INSERT INTO job ("JOB_ID", "JOB_TITLE") VALUES (1, 'Manager'), (2, 'Cashier');

CREATE TABLE employee (
  "EMPLOYEE_ID" SERIAL PRIMARY KEY,
  "FIRST_NAME" varchar(50) DEFAULT NULL,
  "LAST_NAME" varchar(50) DEFAULT NULL,
  "GENDER" varchar(50) DEFAULT NULL,
  "EMAIL" varchar(100) DEFAULT NULL,
  "PHONE_NUMBER" varchar(11) UNIQUE DEFAULT NULL,
  "JOB_ID" INTEGER REFERENCES job("JOB_ID"),
  "LOCATION_ID" INTEGER REFERENCES location("LOCATION_ID")
);

INSERT INTO employee ("EMPLOYEE_ID", "FIRST_NAME", "LAST_NAME", "GENDER", "EMAIL", "PHONE_NUMBER", "JOB_ID", "LOCATION_ID") VALUES
(1, 'Kamau', 'Kenyatta', 'Male', 'pavan@gmail.com', '9876567865', 1, 113),
(5, 'Ochieng', 'Odinga', 'Male', 'karan@gmail.com', '89763546334', 1, 163),
(6, 'Kiprop', 'Njoroge', 'Male', 'rushi@gmail.com', '9874657834', 2, 164),
(7, 'Kipchoge', 'Mutua', 'Male', 'gopal@gmail.com', '7894653125', 2, 165);

CREATE TABLE type (
  "TYPE_ID" SERIAL PRIMARY KEY,
  "TYPE" varchar(50) DEFAULT NULL
);

INSERT INTO type ("TYPE_ID", "TYPE") VALUES (1, 'Admin'), (2, 'User');

CREATE TABLE users (
  "ID" SERIAL PRIMARY KEY,
  "EMPLOYEE_ID" INTEGER REFERENCES employee("EMPLOYEE_ID"),
  "USERNAME" varchar(50) DEFAULT NULL,
  "PASSWORD" varchar(50) DEFAULT NULL,
  "TYPE_ID" INTEGER REFERENCES type("TYPE_ID")
);

INSERT INTO users ("ID", "EMPLOYEE_ID", "USERNAME", "PASSWORD", "TYPE_ID") VALUES
(1, 1, 'admin1', '6C7CA345F63F835CB353FF15BD6C5E052EC08E7A', 1),
(2, 5, 'admin2', '315F166C5ACA63A157F7D41007675CB44A948B33', 1),
(3, 6, 'admin3', '33AAB3C7F01620CADE108F488CFD285C0E62C1EC', 2),
(4, 7, 'admin4', 'EA053D11A8AAD1CCF8C18F9241BAEB9EC47E5D64', 2);

CREATE TABLE supplier (
  "SUPPLIER_ID" SERIAL PRIMARY KEY,
  "COMPANY_NAME" varchar(50) DEFAULT NULL,
  "LOCATION_ID" INTEGER REFERENCES location("LOCATION_ID"),
  "PHONE_NUMBER" varchar(11) DEFAULT NULL
);

INSERT INTO supplier ("SUPPLIER_ID", "COMPANY_NAME", "LOCATION_ID", "PHONE_NUMBER") VALUES
(18, 'TOYOTA', 160, '9873654783'),
(19, 'Mahindra', 161, '8765904753'),
(20, 'Suziki', 162, '8973645632');

CREATE TABLE product (
  "PRODUCT_ID" SERIAL PRIMARY KEY,
  "PRODUCT_CODE" varchar(20) NOT NULL,
  "NAME" varchar(50) DEFAULT NULL,
  "DESCRIPTION" varchar(250) NOT NULL,
  "QTY_STOCK" INTEGER DEFAULT NULL,
  "ON_HAND" INTEGER NOT NULL,
  "PRICE" INTEGER DEFAULT NULL,
  "CATEGORY_ID" INTEGER REFERENCES category("CATEGORY_ID"),
  "SUPPLIER_ID" INTEGER REFERENCES supplier("SUPPLIER_ID"),
  "DATE_STOCK_IN" varchar(50) NOT NULL
);

INSERT INTO product ("PRODUCT_ID", "PRODUCT_CODE", "NAME", "DESCRIPTION", "QTY_STOCK", "ON_HAND", "PRICE", "CATEGORY_ID", "SUPPLIER_ID", "DATE_STOCK_IN") VALUES
(28, '1', 'wires', '', 1, 1, 300, 4, 19, ''),
(29, '1', 'headlights', '', 1, 1, 2500, 4, 19, '');

CREATE TABLE customer (
  "CUST_ID" SERIAL PRIMARY KEY,
  "FIRST_NAME" varchar(50) DEFAULT NULL,
  "LAST_NAME" varchar(50) DEFAULT NULL,
  "PHONE_NUMBER" varchar(11) DEFAULT NULL
);

INSERT INTO customer ("CUST_ID", "FIRST_NAME", "LAST_NAME", "PHONE_NUMBER") VALUES
(17, 'Wanjiku', 'Mwangi', '9873635464'),
(18, 'Maina', 'Kenyatta', '8934827482'),
(19, 'Miano', 'Njeri', '9876478974'),
(20, 'Omondi', 'Oloo', '8678947353'),
(21, 'Mutinda', 'Muthoni', '7865346734');

CREATE TABLE transaction_details (
  "ID" SERIAL PRIMARY KEY,
  "TRANS_D_ID" varchar(250) NOT NULL,
  "PRODUCTS" varchar(250) NOT NULL,
  "QTY" varchar(250) NOT NULL,
  "PRICE" varchar(250) NOT NULL,
  "EMPLOYEE" varchar(250) NOT NULL,
  "ROLE" varchar(250) NOT NULL
);

INSERT INTO transaction_details ("ID", "TRANS_D_ID", "PRODUCTS", "QTY", "PRICE", "EMPLOYEE", "ROLE") VALUES
(21, '111141641', 'headlights', '1', '2500', 'Kamau', 'Manager');

CREATE TABLE transaction (
  "TRANS_ID" SERIAL PRIMARY KEY,
  "CUST_ID" INTEGER REFERENCES customer("CUST_ID"),
  "NUMOFITEMS" varchar(250) NOT NULL,
  "SUBTOTAL" varchar(50) NOT NULL,
  "LESSVAT" varchar(50) NOT NULL,
  "NETVAT" varchar(50) NOT NULL,
  "ADDVAT" varchar(50) NOT NULL,
  "GRANDTOTAL" varchar(250) NOT NULL,
  "CASH" varchar(250) NOT NULL,
  "DATE" varchar(50) NOT NULL,
  "TRANS_D_ID" varchar(250) NOT NULL
);

INSERT INTO transaction ("TRANS_ID", "CUST_ID", "NUMOFITEMS", "SUBTOTAL", "LESSVAT", "NETVAT", "ADDVAT", "GRANDTOTAL", "CASH", "DATE", "TRANS_D_ID") VALUES
(13, 20, '1', '2,500.00', '267.86', '2,232.14', '267.86', '2,500.00', '2500', '2020-11-11 04:15 am', '111141641');
