const fs = require("fs");
const multer = require('multer');
const Nft = require("../../models/nft");
const Collection = require("../../models/collection");

exports.uploadNFT = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, './public/images/nft');
        },
        filename(req, file, cb) {
            cb(null, `nft_${new Date().getTime()}.png`);
        }
    }),
    limits: {
        fileSize: 24000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.*$/)) {
            return cb(
                new Error(
                    'only upload image files.'
                )
            );
        }
        cb(undefined, true);
    }
});

exports.removeImage = (req, res) => {
    try {
        if (req.body.url !== "images/collections/collection_1648001949181.png") {
            let path = `./public/${req.body.url}`;
            fs.unlinkSync(path);
        }
        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false });
    }
};

exports.getNFTs = (req, res) => {
    const filter = {};
    
    if (req.query.collectionAddress) {
        filter.collection_address = req.query.collectionAddress;
    }

    Nft.find(filter).exec((err, result) => {
        if (err) {
            res.status(500).send({ message: err });
        }
        res.status(200).send(result);
    });
};

exports.saveNFT = (req, res) => {
    try {
        const { metadata_id, token_id, collection_address, metadata, created_at, royalty_fraction } = req.body;
        const new_NFT = new Nft({
            metadata_id: metadata_id,
            token_id: token_id,
            collection_address: collection_address,
            metadata: metadata,
            royalty_fraction: royalty_fraction,
            created_at: created_at
        });
        
        new_NFT.save();
        res.status(200).send({
            success: true,
            message: "NFT saved successfully!"
        });
    } catch {
        res.status(400).send({
            success: false,
            message: "Error while saving NFT. Try again."
        });
    };
};

exports.updateNFT = (req, res) => {
    const filter = { metadata_id: req.body.metadata_id };
    const updates = { token_id: req.body.token_id };
    Nft.findOneAndUpdate(filter, updates, (err, result) => {
        if (err) {
            res.status(500).send(false);
        }
        res.status(200).send(true);
    });
};

exports.updateNFTByEvent = (token_id, buyer) => {
    const filter = { idForSale: token_id };
    const updates = { owner: buyer.toUpperCase(), onSale: false };
    Nft.findOneAndUpdate(filter, updates, (result) => {
        console.log("A NFT is updated successfully!");
    });
};

exports.totalCount = async () => {
    try {
        return await Nft.count();
    } catch (error) {
        console.log(error);
    }
};

exports.tokenURI = (req, res) => {
 
    filter = {token_id : req.params.token_id}

    Nft.findOne(filter).exec((err, result) => {
        if (err) {
            res.status(500).send({ message: err });
        }
  
        if(result){
            let metadata = JSON.parse(result.metadata);
            res.status(200).send(metadata);
        }else{
            res.status(500).send({ message: err });
        }
        
    });
}

exports.compareAndSaveNFTs = (data) => {
    Nft.find({ idForSale: data.token_id }).exec((err, result) => {
        if (result.length === 0) {
            const uri_data = JSON.parse(data.token_uri);
            Collection.findOne({ collectionId: uri_data.collectionId }).exec((err, result) => {
                if (result !== null) {
                    const new_NFT = new Nft({
                        url: uri_data.nft,
                        idForSale: data.token_id,
                        collectionId: uri_data.collectionId,
                        name: uri_data.name,
                        owner: uri_data.owner.toUpperCase(),
                        description: uri_data.description,
                        royalty: uri_data.royalty,
                        price: uri_data.price,
                        property: uri_data.property,
                        onSale: data.onSale,
                        date: new Date().toGMTString()
                    });
                    new_NFT.save();
                }
            });
        }
    })
};