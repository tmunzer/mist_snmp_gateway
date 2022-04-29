# mist_snmp_gateway
This application is a gateway to provide Mist Cloud information through SNMP. The application is periodicly synchronising the statistics from the Mist Cloud to expose them through SNMP. 

This is just a proof of concept/example, and only a few information are exposed. It can be extended to provide more information.

# MIT LICENSE

Copyright (c) 2022 Thomas Munzer

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# Features
* Supports SNMP v2c and v3
* Synchronises statistics data from a Mist Organisation:
  * Mist Org Stats
  * Mist Sites Stats
  * Mist APs Stats
* Runs SNMP server to expose statistics through SNMP

**Note:** 
A custom SNMP MIB has been written for this purpose. It can be found [here](https://github.com/tmunzer/mist_snmp_gateway/blob/main/src/mibs/MISTLAB.mib)

**Note 2:**
Since this is just a proof of concept, the written MIB does not use a registered Private Enterprise Number (PEN). The enterprise OID has been randomly selected (OID .1.3.6.1.4.1.65535) and may interfer with other SNMP solutions. If it's the case, please update the `SNMP_OID` env variable, and the `enterprises` OID in the MIB file.

# Examples
## Org Information
<div>
<img src="https://github.com/tmunzer/mist_snmp_gateway/raw/main/._readme/img/org_cli.jpg"  width="49%"  />
<img src="https://github.com/tmunzer/mist_snmp_gateway/raw/main/._readme/img/org_nagios.jpg"  width="49%"  />
</div>

## Site Information
**Note:** The SNMP Index is the site ID (e.g. `snmpget -v2c -cpublic <host>  .1.3.6.1.4.1.65535.2.1.1.2.\"<site_id>\"`)
<div>
<img src="https://github.com/tmunzer/mist_snmp_gateway/raw/main/._readme/img/site_cli.jpg"  width="49%"  />
<img src="https://github.com/tmunzer/mist_snmp_gateway/raw/main/._readme/img/org_nagios.jpg"  width="49%"  />
</div>

## AP Information
**Note:** The SNMP Index is the site ID and the AP MAC address (e.g. `snmpget -v2c -cpublic <host>  .1.3.6.1.4.1.65535.2.1.1.2.\"<site_id>\".\"<mac>\"`)
<div>
<img src="https://github.com/tmunzer/mist_snmp_gateway/raw/main/._readme/img/ap_cli.jpg"  width="49%"  />
<img src="https://github.com/tmunzer/mist_snmp_gateway/raw/main/._readme/img/ap_table.jpg"  width="49%"  />
</div>
<div>
<img src="https://github.com/tmunzer/mist_snmp_gateway/raw/main/._readme/img/ap_nagios.jpg"  width="49%"  />
</div>


# Install
This Reference Application can be used as a standalone Application, or it can be deployed as a Docker Image (recommanded).

## Deploy the Docker version (recommanded)
This application is available as a [Docker Image](https://hub.docker.com/repository/docker/tmunzer/mist_webhook_monitor). The Dockerfile is also available if you want top build it on your own.

The Docker Image exposes the following ports:
* UDP161

### Run the Docker version
`   docker create -v  <path_to_config.js>/env_file:/app/.env:ro --link <mongoDB_container_name>:mongo --name="<container_name>" -p 161:161 tmunzer/mist_snmp_gateway`

### Configure the Docker version
Configuration can be done through the config file. An example of the `config.js` file can be found in `src/config_example.js`. Then, you just need to link the `config.js` file to `/app/config.js` in you container.

You can also use environment variables to configure the app:

Variable Name | Type | Default Value | Comment 
------------- | ---- | ------------- | ------- 
MIST_TOKEN | string | null | Your Mist API Token used by the app to request the Mist Cloud  |
MIST_HOST | string | "api.mist.com" | The Mist Cloud to request (e.g. "api.api.com", "api.eu.mist.com", "api.gc1.mist.com", etc...) |
MIST_ORG_ID | string | null | Your Mist Org ID |
MIST_SITE_IDS | string | null | List of Mist Site IDs (comma separated) to request. If null, all the sites will be synchronised |
MIST_SYNC_TIME | integer | 15 | Duration between each synchronisation |
MONGO_HOST | string | null | Mongo server hostname |
MONGO_DB | string | snmp | Mongo Database name |
MONGO_USER | string | null | If the Mongo server require authentication |
MONGO_PASSWORD | string | null | If the Mongo server require authentication |
MONGO_ENC_KEY | string | null | Used to encrypt the data stored inside the Mongo DB. If not set, the data will be store in cleartext. Can be generated with `openssl rand -base64 32` command |
MONGO_SIG_KEY | string | null | Used to encrypt the data stored inside the Mongo DB. If not set, the data will be store in cleartext. Can be generated with `openssl rand -base64 64` command |
SNMP_VERSION | integer | 2 | SNMP version to use: `2` means SNMP v2c, `3` means SNMP v3 |
SNMP_V2C_COMMUNITY | string | public | if `SNMP_VERSION`==`2`, public community to use | 
SNMP_V3_USER | string | null | if `SNMP_VERSION`==`3`, SNMP user | 
SNMP_V3_AUTH_PROTOCOL | string | SHA | if `SNMP_VERSION`==`3`, authentication protocol (`SHA` or `MD5`) | 
SNMP_V3_AUTH_KEY | string | null | if `SNMP_VERSION`==`3`, SNMP Authentication Key | 
SNMP_V3_PRIV_PROTOCOL | string | AES | if `SNMP_VERSION`==`3`, encryption protocol (`AES` or `DES`) | 
SNMP_V3_PRIV_KEY | string | null | if `SNMP_VERSION`==`3`, SNMP Encryption Key | 
SNMP_LISTENING_IP | string | null |  IP address to bind to - default to null, which means bind to all IP addresses | 
SNMP_OID | integer | 65535 | Enterprise OID to use (see **Note 2** above)|



## Deploy the Standalone Application
This Reference APP is built over NodeJS. 

### Deploy the Application
* Install NodeJS LTS: https://nodejs.org/en/download/.
* Clone this repo.
* Configure the APP settings, in the `src/.env` file. You will find an example in `src/env_example`. With Docker deployment, all the settings can be configured by using Environment Variables (see above)
* Install npm packages (`npm install` from the project folder).
* Start the APP with `npm start` from the `src` folder

