export const BOUNDED_STEPWISE_LINEAR_PRICE_ADAPTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_initialPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_slope",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_bucketSize",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_maxPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minPrice",
        "type": "uint256"
      }
    ],
    "name": "areParamsValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "_data",
        "type": "bytes"
      }
    ],
    "name": "getDecodedData",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "initialPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "slope",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "bucketSize",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isDecreasing",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "maxPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minPrice",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_initialPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_slope",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_bucketSize",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isDecreasing",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "_maxPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minPrice",
        "type": "uint256"
      }
    ],
    "name": "getEncodedData",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_timeElapsed",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "_priceAdapterConfigData",
        "type": "bytes"
      }
    ],
    "name": "getPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "_priceAdapterConfigData",
        "type": "bytes"
      }
    ],
    "name": "isPriceAdapterConfigDataValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
]
