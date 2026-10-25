#!/usr/bin/env bash
# Create the Azure VM for Ruchintachi (issue #20).
# Run from your own machine with the Azure CLI logged in (`az login`).
#
# Creates: resource group, Ubuntu 24.04 LTS VM (Standard_B1s, free-tier eligible),
# a public IP with an Azure DNS name, and a network security group that allows
# 80/443 from anywhere and 22 only from your current IP. SSH key login only.
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-ruchintachi-rg}"
LOCATION="${LOCATION:-eastus}"
VM_NAME="${VM_NAME:-ruchintachi-vm}"
VM_SIZE="${VM_SIZE:-Standard_B1s}"
ADMIN_USER="${ADMIN_USER:-azureuser}"
DNS_LABEL="${DNS_LABEL:?set DNS_LABEL, e.g. DNS_LABEL=ruchintachi -> ruchintachi.<region>.cloudapp.azure.com}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519.pub}"
MY_IP="${MY_IP:-$(curl -fsS https://api.ipify.org)}"

[ -f "$SSH_KEY" ] || { echo "SSH public key not found: $SSH_KEY (create one with ssh-keygen -t ed25519)" >&2; exit 1; }

az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --image Ubuntu2404 \
  --size "$VM_SIZE" \
  --admin-username "$ADMIN_USER" \
  --authentication-type ssh \
  --ssh-key-values "$SSH_KEY" \
  --public-ip-sku Standard \
  --public-ip-address-dns-name "$DNS_LABEL" \
  --os-disk-size-gb 30 \
  --nsg-rule NONE \
  --output none

NSG="${VM_NAME}NSG"
az network nsg rule create -g "$RESOURCE_GROUP" --nsg-name "$NSG" -n allow-ssh-me \
  --priority 100 --protocol Tcp --destination-port-ranges 22 \
  --source-address-prefixes "$MY_IP/32" --access Allow --output none
az network nsg rule create -g "$RESOURCE_GROUP" --nsg-name "$NSG" -n allow-web \
  --priority 110 --protocol Tcp --destination-port-ranges 80 443 \
  --source-address-prefixes Internet --access Allow --output none

FQDN="$(az network public-ip show -g "$RESOURCE_GROUP" -n "${VM_NAME}PublicIP" --query dnsSettings.fqdn -o tsv)"
echo "VM ready: ssh $ADMIN_USER@$FQDN"
echo "Next: copy deploy/setup-server.sh to the VM and run it with SITE_ADDRESS=$FQDN"
