--To execute:
--sqlite3 ../src/geocode.db ".read commands.sql"

--CSV downloaded from https://simplemaps.com/data/us-cities

.mode csv
.import uscitiesv1.3.csv uscities

CREATE INDEX city_index ON uscities (city);

select count(*) from uscities;

