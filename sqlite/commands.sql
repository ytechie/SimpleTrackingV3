--To execute:
--sqlite3 ../src/geocode.db ".read commands.sql"

--CSV downloaded from https://simplemaps.com/data/us-cities

.mode csv
.import uscitiesv1.3.csv uscities_temp

BEGIN TRANSACTION;
CREATE TABLE uscities(city, state_id, state_name, lat, lng, new);
INSERT INTO uscities SELECT city, state_id, state_name, lat, lng, '0' FROM uscities_temp;
DROP TABLE uscities_temp;
COMMIT;

CREATE INDEX city_index ON uscities (city);

CREATE TABLE otherlocations(location, lat, lng, new);
CREATE INDEX otherlocations_index ON otherlocations (location);

select count(*) from uscities;

